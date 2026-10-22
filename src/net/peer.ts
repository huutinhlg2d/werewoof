import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import type { Link } from './link';
import type { ClientMessage, HostMessage } from './protocol';

const PEER_PREFIX = 'werewoof-';
// No 0/O/1/I so codes survive being read aloud.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
const CONNECT_TIMEOUT_MS = 10_000;

export const normalizeCode = (code: string): string => code.trim().toUpperCase();

export const isValidCode = (code: string): boolean =>
  code.length === CODE_LENGTH && [...code].every((char) => CODE_ALPHABET.includes(char));

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

// PeerJS already ships a STUN + public TURN default; only override when the deployer supplies their own TURN.
function peerOptions(): PeerOptions {
  const { VITE_TURN_URL: url, VITE_TURN_USERNAME: username, VITE_TURN_CREDENTIAL: credential } = import.meta.env;
  if (!url) return {};
  return { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: url, username, credential }] } };
}

function wrap<Out>(connection: DataConnection, onDispose: () => void): Link<Out> {
  let messageHandler: (raw: unknown) => void = () => {};
  let closeHandler: () => void = () => {};
  let closed = false;

  const finish = () => {
    if (closed) return;
    closed = true;
    onDispose();
    closeHandler();
  };

  connection.on('data', (raw) => messageHandler(raw));
  connection.on('close', finish);
  connection.on('error', finish);

  return {
    send: (message) => {
      if (connection.open) connection.send(message);
    },
    close: () => {
      connection.close();
      finish();
    },
    onMessage: (handler) => {
      messageHandler = handler;
    },
    onClose: (handler) => {
      closeHandler = handler;
    },
  };
}

export interface Room {
  code: string;
  /** Fires for every player connection once its data channel is open. */
  onLink(handler: (link: Link<HostMessage>) => void): void;
  destroy(): void;
}

function tryOpenRoom(code: string): Promise<Room> {
  return new Promise((resolve, reject) => {
    const peer = new Peer(PEER_PREFIX + code, { ...peerOptions(), debug: 0 });
    let linkHandler: (link: Link<HostMessage>) => void = () => {};

    const fail = (error: unknown) => {
      peer.destroy();
      reject(error);
    };

    peer.once('error', fail);
    peer.once('open', () => {
      peer.off('error', fail);
      // Losing the broker connection would hide the room from new joiners.
      peer.on('disconnected', () => {
        if (!peer.destroyed) peer.reconnect();
      });
      peer.on('connection', (connection) => {
        connection.on('open', () => linkHandler(wrap<HostMessage>(connection, () => {})));
      });
      resolve({
        code,
        onLink: (handler) => {
          linkHandler = handler;
        },
        destroy: () => peer.destroy(),
      });
    });
  });
}

/** Claims a free room code on the public broker; retries on the rare collision. */
export async function openRoom(maxAttempts = 5): Promise<Room> {
  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await tryOpenRoom(randomCode());
    } catch (error) {
      lastError = error;
      if ((error as { type?: string }).type !== 'unavailable-id') break;
    }
  }
  throw lastError;
}

/** Rejects if the room does not exist or the channel is not open within the timeout. */
export function connectToRoom(code: string): Promise<Link<ClientMessage>> {
  return new Promise((resolve, reject) => {
    const peer = new Peer({ ...peerOptions(), debug: 0 });
    const fail = (error: unknown) => {
      clearTimeout(timer);
      peer.destroy();
      reject(error);
    };
    const timer = setTimeout(() => fail(new Error('timeout')), CONNECT_TIMEOUT_MS);

    peer.once('error', fail);
    peer.once('open', () => {
      const connection = peer.connect(PEER_PREFIX + normalizeCode(code), { reliable: true, serialization: 'json' });
      connection.once('open', () => {
        clearTimeout(timer);
        peer.off('error', fail);
        resolve(wrap<ClientMessage>(connection, () => peer.destroy()));
      });
    });
  });
}
