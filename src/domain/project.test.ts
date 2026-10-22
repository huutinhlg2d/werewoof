import { describe, expect, it } from 'vitest';
import { makeEvent, type EventBody } from './events';
import { projectFor } from './project';
import { getPreset } from './presets';
import { reduce } from './reduce';

const classic = getPreset('classic')!;

const state = reduce(
  (
    [
      { type: 'preset.loaded', presetId: classic.id, roles: classic.roles, phases: classic.phases },
      { type: 'player.joined', playerId: 'a', name: 'Ann' },
      { type: 'player.joined', playerId: 'b', name: 'Bob' },
      { type: 'role.assigned', playerId: 'a', roleId: 'villager' },
      { type: 'role.assigned', playerId: 'b', roleId: 'werewolf' },
      { type: 'token.added', playerId: 'b', token: { id: 't1', label: 'Secret-token' } },
      { type: 'note.added', noteId: 'n1', text: 'secret-note' },
      { type: 'message.sent', to: 'a', text: 'for-ann' },
      { type: 'message.sent', to: 'b', text: 'for-bob' },
      { type: 'message.sent', to: 'all', text: 'for-everyone' },
      { type: 'submission.created', playerId: 'b', kind: 'vote', targetId: 'a' },
    ] satisfies EventBody[]
  ).map((body, i) => makeEvent(body, i)),
);

describe('projectFor', () => {
  it('returns null for unknown players', () => {
    expect(projectFor(state, 'ghost')).toBeNull();
  });

  it('shows a player their own role and tokens', () => {
    const view = projectFor(state, 'b')!;

    expect(view.me.role).toEqual({
      id: 'werewolf',
      name: 'Werewolf',
      description: expect.any(String),
    });
    expect(view.me.tokens).toHaveLength(1);
  });

  it('never leaks other players roles, tokens, notes or submissions', () => {
    const view = projectFor(state, 'a')!;
    const json = JSON.stringify(view);

    for (const secret of ['Werewolf', 'werewolf', 'Secret-token', 'secret-note', 'for-bob']) {
      expect(json).not.toContain(secret);
    }
    expect(view.submissions).toEqual([]);
  });

  it('lists everyone publicly with only name and alive state', () => {
    const view = projectFor(state, 'a')!;

    expect(view.players).toEqual([
      { id: 'a', name: 'Ann', alive: true },
      { id: 'b', name: 'Bob', alive: true },
    ]);
  });

  it('includes only broadcast and own private messages', () => {
    const texts = projectFor(state, 'a')!.messages.map((message) => message.text);

    expect(texts).toEqual(['for-ann', 'for-everyone']);
  });
});
