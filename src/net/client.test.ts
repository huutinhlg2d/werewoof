import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameClient, type ClientSession } from './client';
import type { Link } from './link';
import { createLinkPair } from './memoryLink';
import type { ClientMessage, HostMessage } from './protocol';

const view = { me: { id: 'p1', name: 'Ann', alive: true, role: null, tokens: [] }, phase: { label: 'Lobby', day: 0 }, players: [], messages: [], submissions: [] };

function setup(stored: ClientSession | null = null) {
  let session = stored;
  const hostSides: Link<HostMessage>[] = [];
  const sent: ClientMessage[] = [];
  let failNext = false;

  const client = new GameClient({
    name: 'Ann',
    loadSession: () => session,
    saveSession: (next) => (session = next),
    connect: async () => {
      if (failNext) {
        failNext = false;
        throw new Error('offline');
      }
      const [clientSide, hostSide] = createLinkPair<ClientMessage, HostMessage>();
      hostSide.onMessage((raw) => sent.push(raw as ClientMessage));
      hostSides.push(hostSide);
      return clientSide;
    },
  });

  return {
    client,
    sent,
    hostSides,
    session: () => session,
    failNextConnect: () => (failNext = true),
    lastHost: () => hostSides.at(-1)!,
  };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('GameClient', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('joins with the stored token, saves the issued session and exposes the view', async () => {
    const t = setup({ playerId: 'p1', token: 'old', name: 'Ann' });
    t.client.start();
    await flush();

    expect(t.sent[0]).toEqual({ type: 'join', name: 'Ann', token: 'old' });

    t.lastHost().send({ type: 'joined', playerId: 'p1', token: 'new' });
    t.lastHost().send({ type: 'view', view });

    expect(t.session()).toEqual({ playerId: 'p1', token: 'new', name: 'Ann' });
    expect(t.client.getState()).toMatchObject({ status: 'connected', view });
  });

  it('notifies subscribers and stops after unsubscribe', async () => {
    const t = setup();
    const listener = vi.fn();
    const off = t.client.subscribe(listener);
    t.client.start();
    await flush();
    t.lastHost().send({ type: 'view', view });
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    off();
    t.lastHost().send({ type: 'view', view });
    expect(listener).not.toHaveBeenCalled();
  });

  it('reconnects with backoff after the link drops and keeps the last view', async () => {
    const t = setup();
    t.client.start();
    await flush();
    t.lastHost().send({ type: 'view', view });

    t.lastHost().close();
    expect(t.client.getState()).toMatchObject({ status: 'disconnected', view });

    await vi.advanceTimersByTimeAsync(500);
    expect(t.hostSides).toHaveLength(2);
  });

  it('retries when the first connect fails', async () => {
    const t = setup();
    t.failNextConnect();
    t.client.start();
    await flush();
    expect(t.hostSides).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(500);
    expect(t.hostSides).toHaveLength(1);
  });

  it('drops the session and stops retrying once removed', async () => {
    const t = setup({ playerId: 'p1', token: 'tok', name: 'Ann' });
    t.client.start();
    await flush();

    t.lastHost().send({ type: 'rejected', reason: 'removed' });
    await vi.advanceTimersByTimeAsync(60_000);

    expect(t.session()).toBeNull();
    expect(t.client.getState()).toMatchObject({ rejected: 'removed', status: 'disconnected' });
    expect(t.hostSides).toHaveLength(1);
  });

  it('pings, and reconnects when the host goes silent', async () => {
    const t = setup();
    t.client.start();
    await flush();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(t.sent.some((m) => m.type === 'ping')).toBe(true);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(t.hostSides.length).toBeGreaterThan(1);
  });

  it('reconnectNow replaces the link without leaking the old one', async () => {
    const t = setup();
    t.client.start();
    await flush();

    t.client.reconnectNow();
    await flush();

    expect(t.hostSides).toHaveLength(2);
    t.hostSides[1].send({ type: 'view', view });
    expect(t.client.getState().view).toEqual(view);
  });

  it('stop() closes the link and prevents further retries', async () => {
    const t = setup();
    t.client.start();
    await flush();

    t.client.stop();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(t.hostSides).toHaveLength(1);
  });
});
