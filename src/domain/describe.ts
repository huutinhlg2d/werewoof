import type { GameEvent } from './events';
import type { Id } from './types';

export interface Lookup {
  player(id: Id): string;
  role(id: Id): string;
}

/** Names come from the whole log, so voided or removed players still read correctly in the timeline. */
export function createLookup(events: readonly GameEvent[]): Lookup {
  const players = new Map<Id, string>();
  const roles = new Map<Id, string>();
  for (const event of events) {
    if (event.type === 'player.joined') players.set(event.playerId, event.name);
    if (event.type === 'preset.loaded') event.roles.forEach((role) => roles.set(role.id, role.name));
  }
  return { player: (id) => players.get(id) ?? 'Unknown player', role: (id) => roles.get(id) ?? id };
}

export function describeEvent(event: GameEvent, lookup: Lookup): string {
  switch (event.type) {
    case 'preset.loaded':
      return `Loaded preset "${event.presetId}"`;
    case 'player.joined':
      return `${event.name} joined`;
    case 'player.removed':
      return `${lookup.player(event.playerId)} was removed`;
    case 'role.assigned':
      return event.roleId
        ? `${lookup.player(event.playerId)} is now ${lookup.role(event.roleId)}`
        : `${lookup.player(event.playerId)} has no role`;
    case 'player.alive':
      return `${lookup.player(event.playerId)} ${event.alive ? 'was revived' : 'was eliminated'}`;
    case 'token.added':
      return `${lookup.player(event.playerId)} gained ${event.token.label}`;
    case 'token.removed':
      return `${lookup.player(event.playerId)} lost a token`;
    case 'phase.set':
      return `Phase: ${event.label} (day ${event.day})`;
    case 'note.added':
      return `Note${event.playerId ? ` on ${lookup.player(event.playerId)}` : ''}: ${event.text}`;
    case 'message.sent':
      return `Message to ${event.to === 'all' ? 'everyone' : lookup.player(event.to)}: ${event.text}`;
    case 'submission.created':
      return `${lookup.player(event.playerId)} submitted ${event.kind}${event.targetId ? ` → ${lookup.player(event.targetId)}` : ''}`;
    case 'submission.resolved':
      return `Submission ${event.status}`;
    case 'event.voided':
      return 'Undid an earlier event';
  }
}
