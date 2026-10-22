import { beforeEach, describe, expect, it } from 'vitest';
import { gameOf, useGmStore } from './store';

const store = useGmStore;

describe('gm store', () => {
  beforeEach(() => store.getState().reset());

  it('appends events and derives game state', () => {
    store.getState().append({ type: 'player.joined', playerId: 'a', name: 'Ann' });
    store.getState().appendMany([
      { type: 'role.assigned', playerId: 'a', roleId: 'seer' },
      { type: 'phase.set', label: 'Night', day: 1 },
    ]);

    const game = gameOf(store.getState().events);
    expect(game.players.a.roleId).toBe('seer');
    expect(game.phase.label).toBe('Night');
  });

  it('caches derived state per event array but recomputes after a change', () => {
    store.getState().append({ type: 'player.joined', playerId: 'a', name: 'Ann' });
    const first = gameOf(store.getState().events);
    expect(gameOf(store.getState().events)).toBe(first);

    store.getState().append({ type: 'player.alive', playerId: 'a', alive: false });
    expect(gameOf(store.getState().events)).not.toBe(first);
  });

  it('toggleVoid undoes and redoes an event without deleting it', () => {
    store.getState().append({ type: 'player.joined', playerId: 'a', name: 'Ann' });
    store.getState().append({ type: 'player.alive', playerId: 'a', alive: false });
    const killId = store.getState().events[1].id;

    store.getState().toggleVoid(killId);
    expect(gameOf(store.getState().events).players.a.alive).toBe(true);

    const undoId = store.getState().events[2].id;
    store.getState().toggleVoid(undoId);
    expect(gameOf(store.getState().events).players.a.alive).toBe(false);
    expect(store.getState().events).toHaveLength(4);
  });

  it('restart keeps players, preset, room and seats but starts a clean round', () => {
    const { append, setRoomCode, setSessions, restart } = store.getState();
    append({ type: 'player.joined', playerId: 'a', name: 'Ann' });
    append({ type: 'role.assigned', playerId: 'a', roleId: 'seer' });
    append({ type: 'phase.set', label: 'Night', day: 2 });
    setRoomCode('ABCDE');
    setSessions({ tok: 'a' });
    const epoch = store.getState().epoch;

    restart();

    const state = store.getState();
    expect(state).toMatchObject({ roomCode: 'ABCDE', sessions: { tok: 'a' }, epoch });
    const game = gameOf(state.events);
    expect(game.players.a).toMatchObject({ name: 'Ann', roleId: null });
    expect(game.phase).toEqual({ label: 'Lobby', day: 0 });
  });

  it('reset clears the game and bumps the epoch', () => {
    store.getState().append({ type: 'player.joined', playerId: 'a', name: 'Ann' });
    store.getState().setRoomCode('ABCDE');
    store.getState().setSessions({ t: 'a' });
    const epoch = store.getState().epoch;

    store.getState().reset();

    expect(store.getState()).toMatchObject({ events: [], roomCode: null, sessions: {}, epoch: epoch + 1 });
  });
});
