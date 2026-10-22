import { pick } from 'lodash-es';
import type { GameState, Id, Message, PhaseState, RoleDef, Submission, Token } from './types';

export interface PlayerView {
  me: {
    id: Id;
    name: string;
    alive: boolean;
    role: Pick<RoleDef, 'id' | 'name' | 'description'> | null;
    tokens: Token[];
  };
  phase: PhaseState;
  players: { id: Id; name: string; alive: boolean }[];
  messages: Message[];
  submissions: Submission[];
}

/** The only state a player's device ever receives; GM notes and other players' roles/tokens stay out. */
export function projectFor(state: GameState, playerId: Id): PlayerView | null {
  const player = state.players[playerId];
  if (!player) return null;

  const role = player.roleId ? state.roles[player.roleId] : undefined;

  return {
    me: {
      id: player.id,
      name: player.name,
      alive: player.alive,
      role: role ? pick(role, ['id', 'name', 'description']) : null,
      tokens: player.tokens,
    },
    phase: state.phase,
    players: state.playerOrder.map((id) => pick(state.players[id], ['id', 'name', 'alive'])),
    messages: state.messages.filter((message) => message.to === 'all' || message.to === playerId),
    submissions: Object.values(state.submissions).filter((submission) => submission.playerId === playerId),
  };
}
