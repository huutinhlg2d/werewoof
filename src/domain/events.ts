import type { Id, RoleDef, SubmissionStatus, Token } from './types';

export type EventBody =
  | { type: 'preset.loaded'; presetId: Id; roles: RoleDef[]; phases: string[] }
  | { type: 'player.joined'; playerId: Id; name: string }
  | { type: 'player.removed'; playerId: Id }
  | { type: 'role.assigned'; playerId: Id; roleId: Id | null }
  | { type: 'player.alive'; playerId: Id; alive: boolean }
  | { type: 'token.added'; playerId: Id; token: Token }
  | { type: 'token.removed'; playerId: Id; tokenId: Id }
  | { type: 'phase.set'; label: string; day: number }
  | { type: 'note.added'; noteId: Id; text: string; playerId?: Id }
  | { type: 'message.sent'; to: Id | 'all'; text: string }
  | { type: 'submission.created'; playerId: Id; kind: string; targetId?: Id; text?: string }
  | { type: 'submission.resolved'; submissionId: Id; status: Exclude<SubmissionStatus, 'pending'> }
  | { type: 'event.voided'; targetId: Id };

export type GameEvent = EventBody & { id: Id; at: number };

export const newId = (): Id => crypto.randomUUID();

export function makeEvent(body: EventBody, at = Date.now(), id = newId()): GameEvent {
  return { ...body, id, at };
}
