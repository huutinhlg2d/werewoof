import { describe, expect, it } from 'vitest';
import { createLookup, describeEvent } from './describe';
import { makeEvent, type EventBody } from './events';
import { dealRoles, nextPhase } from './phase';
import { tallyVotes } from './tally';
import type { Submission } from './types';

describe('nextPhase', () => {
  const phases = ['Night', 'Day', 'Vote'];

  it('starts day 1 at the first phase from the lobby or a custom label', () => {
    expect(nextPhase(phases, { label: 'Lobby', day: 0 })).toEqual({ label: 'Night', day: 1 });
    expect(nextPhase(phases, { label: 'Custom', day: 3 })).toEqual({ label: 'Night', day: 3 });
  });

  it('walks the cycle and bumps the day when it wraps', () => {
    expect(nextPhase(phases, { label: 'Night', day: 1 })).toEqual({ label: 'Day', day: 1 });
    expect(nextPhase(phases, { label: 'Vote', day: 1 })).toEqual({ label: 'Night', day: 2 });
  });

  it('keeps the current phase when the preset has none', () => {
    expect(nextPhase([], { label: 'Lobby', day: 0 })).toEqual({ label: 'Lobby', day: 0 });
  });
});

describe('dealRoles', () => {
  const identity = <T,>(items: T[]) => items;

  it('pairs players with the expanded pool', () => {
    expect(dealRoles(['a', 'b', 'c'], { wolf: 1, villager: 2 }, identity)).toEqual([
      { playerId: 'a', roleId: 'wolf' },
      { playerId: 'b', roleId: 'villager' },
      { playerId: 'c', roleId: 'villager' },
    ]);
  });

  it('leaves extra players unassigned and drops extra roles', () => {
    expect(dealRoles(['a', 'b'], { wolf: 1 }, identity)).toHaveLength(1);
    expect(dealRoles(['a'], { wolf: 3 }, identity)).toHaveLength(1);
  });

  it('ignores negative counts and keeps the full multiset when shuffled', () => {
    expect(dealRoles(['a'], { wolf: -2 })).toEqual([]);
    const roles = dealRoles(['a', 'b', 'c'], { wolf: 1, villager: 2 }).map((deal) => deal.roleId).sort();
    expect(roles).toEqual(['villager', 'villager', 'wolf']);
  });
});

describe('tallyVotes', () => {
  let at = 0;
  const vote = (playerId: string, targetId: string | undefined, over: Partial<Submission> = {}): Submission => ({
    id: `s${++at}`,
    playerId,
    kind: 'Vote',
    targetId,
    status: 'pending',
    phase: { label: 'Vote', day: 1 },
    at,
    ...over,
  });

  it('counts the latest vote per player and sorts by votes', () => {
    const tally = tallyVotes([vote('a', 'x'), vote('b', 'y'), vote('a', 'y'), vote('c', 'y')], 1);

    expect(tally).toEqual([{ targetId: 'y', voterIds: ['b', 'a', 'c'] }]);
  });

  it('ignores other days, other kinds and rejected votes', () => {
    const tally = tallyVotes(
      [
        vote('a', 'x', { phase: { label: 'Vote', day: 2 } }),
        vote('b', 'x', { kind: 'Use ability' }),
        vote('c', 'x', { status: 'rejected' }),
        vote('d', 'x', { kind: ' vote ' }),
      ],
      1,
    );

    expect(tally).toEqual([{ targetId: 'x', voterIds: ['d'] }]);
  });

  it('lets a rejected re-vote cancel the voter earlier vote', () => {
    expect(tallyVotes([vote('a', 'x'), vote('a', 'x', { status: 'rejected' })], 1)).toEqual([]);
  });

  it('puts the most voted target first', () => {
    const tally = tallyVotes([vote('a', 'x'), vote('b', 'y'), vote('c', 'y')], 1);

    expect(tally.map((entry) => entry.targetId)).toEqual(['y', 'x']);
  });
});

describe('describeEvent', () => {
  const body = (b: EventBody) => makeEvent(b, 0);
  const events = [
    body({ type: 'preset.loaded', presetId: 'classic', roles: [{ id: 'seer', name: 'Seer', description: '' }], phases: [] }),
    body({ type: 'player.joined', playerId: 'a', name: 'Ann' }),
  ];
  const lookup = createLookup(events);

  it('uses names from the whole log', () => {
    expect(describeEvent(body({ type: 'role.assigned', playerId: 'a', roleId: 'seer' }), lookup)).toBe('Ann is now Seer');
    expect(describeEvent(body({ type: 'player.alive', playerId: 'a', alive: false }), lookup)).toBe('Ann was eliminated');
  });

  it('falls back for unknown players', () => {
    expect(describeEvent(body({ type: 'player.removed', playerId: 'zzz' }), lookup)).toBe('Unknown player was removed');
  });

  it('describes notes and private messages', () => {
    expect(describeEvent(body({ type: 'note.added', noteId: 'n', text: 'saved', playerId: 'a' }), lookup)).toBe('Note on Ann: saved');
    expect(describeEvent(body({ type: 'message.sent', to: 'a', text: 'hi' }), lookup)).toBe('Message to Ann: hi');
  });
});
