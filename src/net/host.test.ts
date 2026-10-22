import { describe, expect, it } from 'vitest';
import { makeEvent, reduce, type EventBody, type GameEvent, type Id } from '@/domain';
import { HostSession } from './host';
import { createLinkPair } from './memoryLink';
import type { ClientMessage, HostMessage } from './protocol';

function setup(initialSessions: Record<string, Id> = {}) {
  const events: GameEvent[] = [];
  const sessions = { ...initialSessions };
  const host = new HostSession({
    getState: () => reduce(events),
    append: (body: EventBody) => events.push(makeEvent(body)),
    sessions,
    onSessionsChange: (next) => Object.assign(sessions, next),
  });

  /** Opens a connection and records everything the host sends back. */
  const connect = () => {
    const [hostSide, clientSide] = createLinkPair<HostMessage, ClientMessage>();
    const received: HostMessage[] = [];
    let closed = false;
    clientSide.onMessage((raw) => received.push(raw as HostMessage));
    clientSide.onClose(() => (closed = true));
    host.attach(hostSide);
    return { send: (m: unknown) => clientSide.send(m as ClientMessage), received, isClosed: () => closed };
  };

  return { host, events, sessions, connect, state: () => reduce(events) };
}

const joined = (received: HostMessage[]) => received.find((m) => m.type === 'joined') as Extract<HostMessage, { type: 'joined' }>;

describe('HostSession', () => {
  it('seats a new player, issues a token and sends their view', () => {
    const { connect, state, sessions } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: '  Ann ' });

    const { playerId, token } = joined(conn.received);
    expect(state().players[playerId].name).toBe('Ann');
    expect(sessions[token]).toBe(playerId);
    expect(conn.received.some((m) => m.type === 'view' && m.view.me.id === playerId)).toBe(true);
  });

  it('rejects a join without a name', () => {
    const { connect, state } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: '   ' });

    expect(conn.received).toEqual([{ type: 'rejected', reason: 'name required' }]);
    expect(state().playerOrder).toEqual([]);
  });

  it('lets a returning device reclaim its seat and closes the stale link', () => {
    const { connect, state } = setup();
    const first = connect();
    first.send({ type: 'join', name: 'Ann' });
    const { playerId, token } = joined(first.received);

    const second = connect();
    second.send({ type: 'join', name: 'ignored', token });

    expect(joined(second.received).playerId).toBe(playerId);
    expect(state().playerOrder).toEqual([playerId]);
    expect(first.isClosed()).toBe(true);
  });

  it('treats an unknown token as a new player instead of trusting it', () => {
    const { connect, state } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: 'Ann', token: 'forged' });

    expect(state().playerOrder).toHaveLength(1);
    expect(joined(conn.received).token).not.toBe('forged');
  });

  it('records valid submissions and ignores unknown targets', () => {
    const { connect, state } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: 'Ann' });
    const { playerId } = joined(conn.received);

    conn.send({ type: 'submit', kind: 'vote', targetId: 'ghost' });
    expect(Object.values(state().submissions)).toHaveLength(0);

    conn.send({ type: 'submit', kind: 'vote', targetId: playerId });
    expect(Object.values(state().submissions)).toMatchObject([{ playerId, kind: 'vote', status: 'pending' }]);
  });

  it('caps pending submissions per player', () => {
    const { connect, state } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: 'Ann' });

    for (let i = 0; i < 30; i++) conn.send({ type: 'submit', kind: 'spam' });

    expect(Object.values(state().submissions)).toHaveLength(20);
  });

  it('ignores malformed or unauthenticated messages', () => {
    const { connect, state } = setup();
    const conn = connect();
    conn.send({ type: 'submit', kind: 'vote' });
    conn.send({ type: 'join', name: 42 });
    conn.send({ type: 'join', name: 'x'.repeat(100) });
    conn.send('nonsense');

    expect(conn.received).toEqual([]);
    expect(state().playerOrder).toEqual([]);
  });

  it('answers pings', () => {
    const conn = setup().connect();
    conn.send({ type: 'ping' });

    expect(conn.received).toEqual([{ type: 'pong' }]);
  });

  it('only resends a view when it changed', () => {
    const { connect, host, events } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: 'Ann' });
    const before = conn.received.length;

    host.broadcast();
    expect(conn.received).toHaveLength(before);

    events.push(makeEvent({ type: 'phase.set', label: 'Night', day: 1 }));
    host.broadcast();
    expect(conn.received).toHaveLength(before + 1);
  });

  it('tells a removed player and closes their link', () => {
    const { connect, host, events } = setup();
    const conn = connect();
    conn.send({ type: 'join', name: 'Ann' });
    const { playerId } = joined(conn.received);

    events.push(makeEvent({ type: 'player.removed', playerId }));
    host.broadcast();

    expect(conn.received.at(-1)).toEqual({ type: 'rejected', reason: 'removed' });
    expect(conn.isClosed()).toBe(true);
    expect(host.connectedIds()).toEqual([]);
  });
});
