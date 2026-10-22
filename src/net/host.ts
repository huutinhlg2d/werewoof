import { isEqual } from 'lodash-es';
import { newId, projectFor, type EventBody, type GameState, type Id, type PlayerView } from '@/domain';
import type { Link } from './link';
import { LIMITS, parseClientMessage, type HostMessage } from './protocol';

export interface HostDeps {
  getState(): GameState;
  /** Must apply the event to `getState()` synchronously; the GM calls `broadcast()` after its own changes. */
  append(body: EventBody): void;
  /** Rejoin token -> player id; the GM store persists this next to the event log. */
  sessions?: Record<string, Id>;
  onSessionsChange?(sessions: Record<string, Id>): void;
}

interface Seat {
  link: Link<HostMessage>;
  playerId: Id;
  lastView?: PlayerView;
}

/** Authoritative side: validates untrusted player messages and sends each player only their projection. */
export class HostSession {
  private sessions: Record<string, Id>;
  private seats = new Map<Id, Seat>();

  constructor(private deps: HostDeps) {
    this.sessions = { ...deps.sessions };
  }

  /** Call for every incoming connection. */
  attach(link: Link<HostMessage>): void {
    let seat: Seat | null = null;

    link.onMessage((raw) => {
      const message = parseClientMessage(raw);
      if (!message) return;

      if (message.type === 'ping') {
        link.send({ type: 'pong' });
      } else if (message.type === 'join') {
        if (!seat) seat = this.join(link, message.name, message.token);
      } else if (seat) {
        this.submit(seat.playerId, message);
      }
    });

    link.onClose(() => {
      // A reconnect may already have replaced this link.
      if (seat && this.seats.get(seat.playerId) === seat) this.seats.delete(seat.playerId);
    });
  }

  /** Re-send views after any state change; unchanged views are skipped. */
  broadcast(): void {
    const state = this.deps.getState();
    for (const seat of this.seats.values()) {
      const view = projectFor(state, seat.playerId);
      if (!view) {
        this.seats.delete(seat.playerId);
        seat.link.send({ type: 'rejected', reason: 'removed' });
        seat.link.close();
      } else if (!isEqual(view, seat.lastView)) {
        seat.lastView = view;
        seat.link.send({ type: 'view', view });
      }
    }
  }

  connectedIds(): Id[] {
    return [...this.seats.keys()];
  }

  private join(link: Link<HostMessage>, rawName: string, token?: string): Seat | null {
    const knownId = token ? this.sessions[token] : undefined;
    let playerId: Id;
    let seatToken: string;

    if (token && knownId && this.deps.getState().players[knownId]) {
      playerId = knownId;
      seatToken = token;
    } else {
      const name = rawName.trim();
      if (!name) {
        link.send({ type: 'rejected', reason: 'name required' });
        return null;
      }
      playerId = newId();
      seatToken = newId();
      this.sessions[seatToken] = playerId;
      this.deps.onSessionsChange?.({ ...this.sessions });
      this.deps.append({ type: 'player.joined', playerId, name });
    }

    // A second device with the same token takes over the seat.
    this.seats.get(playerId)?.link.close();

    const seat: Seat = { link, playerId };
    this.seats.set(playerId, seat);
    link.send({ type: 'joined', playerId, token: seatToken });
    this.broadcast();
    return seat;
  }

  private submit(playerId: Id, message: { kind: string; targetId?: Id; text?: string }): void {
    const state = this.deps.getState();
    if (message.targetId && !state.players[message.targetId]) return;

    const pending = Object.values(state.submissions).filter(
      (submission) => submission.playerId === playerId && submission.status === 'pending',
    );
    if (pending.length >= LIMITS.pendingPerPlayer) return;

    this.deps.append({
      type: 'submission.created',
      playerId,
      kind: message.kind,
      targetId: message.targetId,
      text: message.text,
    });
    this.broadcast();
  }
}
