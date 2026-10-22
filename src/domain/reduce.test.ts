import { describe, expect, it } from 'vitest';
import { makeEvent, type EventBody, type GameEvent } from './events';
import { activeEvents, eventStatuses, reduce } from './reduce';

let clock = 0;
const ev = (body: EventBody, id?: string): GameEvent => makeEvent(body, ++clock, id);

describe('reduce', () => {
  it('builds players, roles, tokens and phase from events', () => {
    const state = reduce([
      ev({ type: 'player.joined', playerId: 'a', name: 'Ann' }),
      ev({ type: 'role.assigned', playerId: 'a', roleId: 'seer' }),
      ev({ type: 'token.added', playerId: 'a', token: { id: 't1', label: 'Lover' } }),
      ev({ type: 'player.alive', playerId: 'a', alive: false }),
      ev({ type: 'phase.set', label: 'Night', day: 1 }),
    ]);

    expect(state.players.a).toMatchObject({ roleId: 'seer', alive: false, tokens: [{ id: 't1' }] });
    expect(state.phase).toEqual({ label: 'Night', day: 1 });
  });

  it('stamps notes and submissions with the phase active when they were made', () => {
    const state = reduce([
      ev({ type: 'player.joined', playerId: 'a', name: 'Ann' }),
      ev({ type: 'phase.set', label: 'Night', day: 2 }),
      ev({ type: 'note.added', noteId: 'n1', text: 'saved b', playerId: 'a' }),
      ev({ type: 'submission.created', playerId: 'a', kind: 'vote', targetId: 'b' }, 's1'),
    ]);

    expect(state.notes[0].phase).toEqual({ label: 'Night', day: 2 });
    expect(state.submissions.s1).toMatchObject({ status: 'pending', phase: { day: 2 } });
  });

  it('resolves submissions', () => {
    const state = reduce([
      ev({ type: 'submission.created', playerId: 'a', kind: 'vote' }, 's1'),
      ev({ type: 'submission.resolved', submissionId: 's1', status: 'approved' }),
    ]);

    expect(state.submissions.s1.status).toBe('approved');
  });

  it('ignores events that point at unknown players', () => {
    const state = reduce([
      ev({ type: 'role.assigned', playerId: 'ghost', roleId: 'seer' }),
      ev({ type: 'token.added', playerId: 'ghost', token: { id: 't', label: 'x' } }),
    ]);

    expect(state.players).toEqual({});
  });

  describe('undo', () => {
    const joined = ev({ type: 'player.joined', playerId: 'a', name: 'Ann' });
    const killed = ev({ type: 'player.alive', playerId: 'a', alive: false });
    const undo = ev({ type: 'event.voided', targetId: killed.id });

    it('voiding an event removes its effect and keeps later ones', () => {
      const later = ev({ type: 'phase.set', label: 'Day', day: 1 });
      const state = reduce([joined, killed, later, undo]);

      expect(state.players.a.alive).toBe(true);
      expect(state.phase.label).toBe('Day');
    });

    it('voiding the void restores the event', () => {
      const redo = ev({ type: 'event.voided', targetId: undo.id });

      expect(reduce([joined, killed, undo, redo]).players.a.alive).toBe(false);
    });

    it('does not mutate the log', () => {
      const log = [joined, killed, undo];
      reduce(log);

      expect(log).toHaveLength(3);
    });

    it('eventStatuses reports what cancels each event and agrees with activeEvents', () => {
      const redo = ev({ type: 'event.voided', targetId: undo.id });
      const afterUndo = [joined, killed, undo];
      const afterRedo = [...afterUndo, redo];

      const undone = eventStatuses(afterUndo);
      expect(undone.get(joined.id)).toEqual({ active: true });
      expect(undone.get(killed.id)).toEqual({ active: false, undoneBy: undo.id });

      const restored = eventStatuses(afterRedo);
      expect(restored.get(killed.id)).toEqual({ active: true });
      expect(restored.get(undo.id)).toEqual({ active: false, undoneBy: redo.id });

      for (const log of [afterUndo, afterRedo]) {
        const statuses = eventStatuses(log);
        const activeIds = log.filter((e) => e.type !== 'event.voided' && statuses.get(e.id)!.active).map((e) => e.id);
        expect(activeIds).toEqual(activeEvents(log).map((e) => e.id));
      }
    });
  });
});
