import type { Id, PlayerView } from '@/domain';
import type { Link } from './link';
import { parseHostMessage, type ClientMessage } from './protocol';

export type ClientStatus = 'connecting' | 'connected' | 'disconnected';

export interface ClientSession {
  playerId: Id;
  token: string;
  name: string;
}

export interface ClientState {
  status: ClientStatus;
  view: PlayerView | null;
  /** Set when the host refuses us for good (e.g. removed); retrying is pointless. */
  rejected: string | null;
}

export interface ClientDeps {
  connect(): Promise<Link<ClientMessage>>;
  /** Join name for first-time players; returning players are identified by the stored session. */
  name: string;
  loadSession(): ClientSession | null;
  saveSession(session: ClientSession | null): void;
}

const PING_MS = 10_000;
const DEAD_AFTER_MS = 30_000;
const RETRY_MS = [500, 1_000, 2_000, 5_000];

/** Player side: keeps one link alive (reconnect with backoff + heartbeat) and exposes the latest view. */
export class GameClient {
  private state: ClientState = { status: 'connecting', view: null, rejected: null };
  private listeners = new Set<() => void>();
  private link: Link<ClientMessage> | null = null;
  private attempt = 0;
  private generation = 0;
  private lastHeard = 0;
  private timers: { ping?: ReturnType<typeof setInterval>; retry?: ReturnType<typeof setTimeout> } = {};
  private stopped = false;

  constructor(private deps: ClientDeps) {}

  getState = (): ClientState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): void {
    this.stopped = false;
    void this.open();
  }

  stop(): void {
    this.stopped = true;
    this.teardown();
  }

  /** Drop and re-open now, e.g. when the tab becomes visible again after the phone slept. */
  reconnectNow(): void {
    if (this.stopped || this.state.rejected) return;
    this.teardown();
    void this.open();
  }

  submit(kind: string, targetId?: Id, text?: string): void {
    this.link?.send({ type: 'submit', kind, targetId, text });
  }

  private set(patch: Partial<ClientState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private async open(): Promise<void> {
    const generation = ++this.generation;
    this.set({ status: 'connecting' });
    let link: Link<ClientMessage>;
    try {
      link = await this.deps.connect();
    } catch {
      if (generation === this.generation) this.scheduleRetry();
      return;
    }
    // Superseded by stop() or a newer reconnect while connecting.
    if (generation !== this.generation) {
      link.close();
      return;
    }

    this.link = link;
    this.lastHeard = Date.now();
    link.onMessage((raw) => this.receive(link, raw));
    link.onClose(() => {
      if (this.link !== link) return;
      this.link = null;
      clearInterval(this.timers.ping);
      this.set({ status: 'disconnected' });
      if (!this.state.rejected) this.scheduleRetry();
    });

    link.send({ type: 'join', name: this.deps.name, token: this.deps.loadSession()?.token });
    this.timers.ping = setInterval(() => this.heartbeat(), PING_MS);
  }

  private receive(link: Link<ClientMessage>, raw: unknown): void {
    if (this.link !== link) return;
    const message = parseHostMessage(raw);
    if (!message) return;
    this.lastHeard = Date.now();

    switch (message.type) {
      case 'joined':
        this.attempt = 0;
        this.deps.saveSession({ playerId: message.playerId, token: message.token, name: this.deps.name });
        this.set({ status: 'connected' });
        break;
      case 'view':
        this.set({ view: message.view });
        break;
      case 'rejected':
        // A removed seat's token is worthless; other refusals (e.g. empty name) keep it.
        if (message.reason === 'removed') this.deps.saveSession(null);
        this.set({ rejected: message.reason, status: 'disconnected' });
        this.teardown();
        break;
      case 'pong':
        break;
    }
  }

  private heartbeat(): void {
    if (Date.now() - this.lastHeard > DEAD_AFTER_MS) {
      this.reconnectNow();
      return;
    }
    this.link?.send({ type: 'ping' });
  }

  private scheduleRetry(): void {
    clearTimeout(this.timers.retry);
    const delay = RETRY_MS[Math.min(this.attempt++, RETRY_MS.length - 1)];
    this.timers.retry = setTimeout(() => void this.open(), delay);
  }

  private teardown(): void {
    this.generation++;
    clearInterval(this.timers.ping);
    clearTimeout(this.timers.retry);
    const link = this.link;
    this.link = null;
    link?.close();
  }
}
