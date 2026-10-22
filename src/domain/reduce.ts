import { produce } from 'immer';
import type { GameEvent } from './events';
import type { GameState, Id } from './types';

export const initialState = (): GameState => ({
  presetId: null,
  roles: {},
  phases: [],
  players: {},
  playerOrder: [],
  phase: { label: 'Lobby', day: 0 },
  notes: [],
  messages: [],
  submissions: {},
});

/** Drops voided events; voiding a void event restores its target (redo). */
export function activeEvents(events: readonly GameEvent[]): GameEvent[] {
  const voided = new Set<Id>();
  const active: GameEvent[] = [];
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (voided.has(event.id)) continue;
    if (event.type === 'event.voided') voided.add(event.targetId);
    else active.push(event);
  }
  return active.reverse();
}

// Events that reference a missing player or item are ignored so a stray edit never breaks replay.
export function applyEvent(state: GameState, event: GameEvent): GameState {
  return produce(state, (draft) => {
    switch (event.type) {
      case 'preset.loaded':
        draft.presetId = event.presetId;
        draft.roles = Object.fromEntries(event.roles.map((role) => [role.id, role]));
        draft.phases = event.phases;
        break;
      case 'player.joined':
        if (draft.players[event.playerId]) break;
        draft.players[event.playerId] = {
          id: event.playerId,
          name: event.name,
          roleId: null,
          alive: true,
          tokens: [],
        };
        draft.playerOrder.push(event.playerId);
        break;
      case 'player.removed':
        delete draft.players[event.playerId];
        draft.playerOrder = draft.playerOrder.filter((id) => id !== event.playerId);
        break;
      case 'role.assigned': {
        const player = draft.players[event.playerId];
        if (player) player.roleId = event.roleId;
        break;
      }
      case 'player.alive': {
        const player = draft.players[event.playerId];
        if (player) player.alive = event.alive;
        break;
      }
      case 'token.added':
        draft.players[event.playerId]?.tokens.push(event.token);
        break;
      case 'token.removed': {
        const player = draft.players[event.playerId];
        if (player) player.tokens = player.tokens.filter((token) => token.id !== event.tokenId);
        break;
      }
      case 'phase.set':
        draft.phase = { label: event.label, day: event.day };
        break;
      case 'note.added':
        draft.notes.push({
          id: event.noteId,
          text: event.text,
          playerId: event.playerId,
          phase: { ...draft.phase },
          at: event.at,
        });
        break;
      case 'message.sent':
        draft.messages.push({ id: event.id, to: event.to, text: event.text, at: event.at });
        break;
      case 'submission.created':
        draft.submissions[event.id] = {
          id: event.id,
          playerId: event.playerId,
          kind: event.kind,
          targetId: event.targetId,
          text: event.text,
          status: 'pending',
          phase: { ...draft.phase },
          at: event.at,
        };
        break;
      case 'submission.resolved': {
        const submission = draft.submissions[event.submissionId];
        if (submission) submission.status = event.status;
        break;
      }
      case 'event.voided':
        break;
    }
  });
}

export function reduce(events: readonly GameEvent[]): GameState {
  return activeEvents(events).reduce(applyEvent, initialState());
}
