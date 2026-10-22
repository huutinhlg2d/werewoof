import type { EventBody } from './events';
import type { GameState } from './types';

/** A fresh log for a new round: same preset and players, with roles, tokens, phase, notes and messages cleared. */
export function restartEvents(game: GameState): EventBody[] {
  const events: EventBody[] = [];
  if (game.presetId) {
    events.push({ type: 'preset.loaded', presetId: game.presetId, roles: Object.values(game.roles), phases: game.phases });
  }
  for (const id of game.playerOrder) {
    events.push({ type: 'player.joined', playerId: id, name: game.players[id].name });
  }
  return events;
}
