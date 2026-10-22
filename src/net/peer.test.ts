import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Fake = {
  destroyed: boolean;
  open?: boolean;
  connection: Fake;
  emit(event: string, ...args: unknown[]): boolean;
};

vi.mock('peerjs', () => {
  // Minimal emitter so the app tsconfig does not need Node typings.
  class Emitter {
    private handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    on(event: string, handler: (...args: unknown[]) => void) {
      this.handlers.set(event, (this.handlers.get(event) ?? new Set()).add(handler));
      return this;
    }
    once(event: string, handler: (...args: unknown[]) => void) {
      const wrapper = (...args: unknown[]) => {
        this.off(event, wrapper);
        handler(...args);
      };
      // Keep the original reachable so `off(event, handler)` still works.
      (wrapper as { original?: unknown }).original = handler;
      return this.on(event, wrapper);
    }
    off(event: string, handler: (...args: unknown[]) => void) {
      for (const candidate of this.handlers.get(event) ?? []) {
        if (candidate === handler || (candidate as { original?: unknown }).original === handler) {
          this.handlers.get(event)!.delete(candidate);
        }
      }
      return this;
    }
    emit(event: string, ...args: unknown[]) {
      const listeners = [...(this.handlers.get(event) ?? [])];
      listeners.forEach((listener) => listener(...args));
      return listeners.length > 0;
    }
  }

  class FakeConnection extends Emitter {
    open = false;
    send = vi.fn();
    close = vi.fn();
  }

  class FakePeer extends Emitter {
    static instances: FakePeer[] = [];
    destroyed = false;
    connection = new FakeConnection();
    constructor() {
      super();
      FakePeer.instances.push(this);
    }
    connect() {
      return this.connection;
    }
    destroy() {
      this.destroyed = true;
    }
  }

  return { default: FakePeer };
});

import Peer from 'peerjs';
import { ConnectError } from './link';
import { connectToRoom, peerOptions } from './peer';

const peers = () => (Peer as unknown as { instances: Fake[] }).instances;
const latest = () => peers().at(-1)!;

describe('connectToRoom', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    peers().length = 0;
  });
  afterEach(() => vi.useRealTimers());

  it('rejects with room-not-found when the broker has no such peer', async () => {
    const result = connectToRoom('ABCDE');
    latest().emit('error', { type: 'peer-unavailable' });

    await expect(result).rejects.toMatchObject({ reason: 'room-not-found' });
    expect(latest().destroyed).toBe(true);
  });

  it('rejects with network for other broker errors', async () => {
    const result = connectToRoom('ABCDE');
    latest().emit('error', { type: 'network' });

    await expect(result).rejects.toBeInstanceOf(ConnectError);
    await expect(result).rejects.toMatchObject({ reason: 'network' });
  });

  it('rejects with timeout when the channel never opens', async () => {
    const result = connectToRoom('ABCDE');
    latest().emit('open');
    const assertion = expect(result).rejects.toMatchObject({ reason: 'timeout' });

    await vi.advanceTimersByTimeAsync(25_000);

    await assertion;
    expect(latest().destroyed).toBe(true);
  });

  it('fails fast when the connection closes before opening', async () => {
    const result = connectToRoom('ABCDE');
    latest().emit('open');
    latest().connection.emit('close');

    await expect(result).rejects.toMatchObject({ reason: 'network' });
  });

  it('resolves once open and is not torn down by the stale timeout or later events', async () => {
    const result = connectToRoom('ABCDE');
    const peer = latest();
    peer.emit('open');
    peer.connection.open = true;
    peer.connection.emit('open');

    const link = await result;
    const onClose = vi.fn();
    link.onClose(onClose);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(peer.destroyed).toBe(false);

    peer.connection.emit('close');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(peer.destroyed).toBe(true);
  });
});

describe('peerOptions', () => {
  it('keeps PeerJS defaults without a TURN url', () => {
    expect(peerOptions({})).toEqual({});
    expect(peerOptions({ VITE_TURN_URL: '' })).toEqual({});
  });

  it('adds STUN plus every comma-separated TURN url with credentials', () => {
    const options = peerOptions({
      VITE_TURN_URL: 'turn:a.example:3478, turns:a.example:443?transport=tcp',
      VITE_TURN_USERNAME: 'u',
      VITE_TURN_CREDENTIAL: 'c',
    });

    expect(options.config?.iceServers).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: ['turn:a.example:3478', 'turns:a.example:443?transport=tcp'], username: 'u', credential: 'c' },
    ]);
  });
});
