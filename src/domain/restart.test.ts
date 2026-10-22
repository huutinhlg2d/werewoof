import { describe, expect, it } from 'vitest';
import { getPreset, makeEvent, presetLoaded, reduce, type EventBody } from './index';
import { restartEvents } from './restart';

const play = (bodies: EventBody[]) => reduce(bodies.map((body, i) => makeEvent(body, i)));

describe('restartEvents', () => {
  const finished = play([
    presetLoaded(getPreset('classic')!),
    { type: 'player.joined', playerId: 'a', name: 'Ann' },
    { type: 'player.joined', playerId: 'b', name: 'Bob' },
    { type: 'player.joined', playerId: 'c', name: 'Cat' },
    { type: 'player.removed', playerId: 'c' },
    { type: 'role.assigned', playerId: 'a', roleId: 'seer' },
    { type: 'player.alive', playerId: 'b', alive: false },
    { type: 'token.added', playerId: 'a', token: { id: 't', label: 'x' } },
    { type: 'phase.set', label: 'Vote', day: 3 },
    { type: 'note.added', noteId: 'n', text: 'secret' },
    { type: 'message.sent', to: 'all', text: 'hi' },
    { type: 'submission.created', playerId: 'a', kind: 'Vote', targetId: 'b' },
  ]);

  const next = play(restartEvents(finished));

  it('keeps the preset and current players with the same ids and order', () => {
    expect(next.presetId).toBe('classic');
    expect(Object.keys(next.roles)).toEqual(Object.keys(finished.roles));
    expect(next.phases).toEqual(finished.phases);
    expect(next.playerOrder).toEqual(['a', 'b']);
    expect(next.players.a.name).toBe('Ann');
  });

  it('clears roles, tokens, alive state, phase, notes, messages and submissions', () => {
    expect(next.players.a).toMatchObject({ roleId: null, tokens: [], alive: true });
    expect(next.players.b.alive).toBe(true);
    expect(next.phase).toEqual({ label: 'Lobby', day: 0 });
    expect(next.notes).toEqual([]);
    expect(next.messages).toEqual([]);
    expect(next.submissions).toEqual({});
  });

  it('drops removed players', () => {
    expect(next.players.c).toBeUndefined();
  });

  it('yields an empty log for an empty game', () => {
    expect(restartEvents(play([]))).toEqual([]);
  });
});
