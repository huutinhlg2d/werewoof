import type { GameState, Id } from '@/domain';
import { Badge, Button, Card, Select, Stack } from '@/ui';
import { useGmStore } from '../store';
import { TokenEditor } from './TokenEditor';

export interface PlayersPanelProps {
  game: GameState;
  online: Id[];
}

export function PlayersPanel({ game, online }: PlayersPanelProps) {
  const append = useGmStore((s) => s.append);
  const roles = Object.values(game.roles);

  if (game.playerOrder.length === 0) return <Card>No players yet. Share the room code or QR.</Card>;

  return (
    <Stack gap={2}>
      {game.playerOrder.map((id) => {
        const player = game.players[id];
        return (
          <Card key={id}>
            <Stack>
              <Stack direction="row" justify="space-between" align="center">
                <strong style={player.alive ? undefined : { textDecoration: 'line-through' }}>{player.name}</strong>
                <Badge tone={online.includes(id) ? 'success' : 'neutral'}>{online.includes(id) ? 'Online' : 'Offline'}</Badge>
              </Stack>
              <Select
                label="Role"
                value={player.roleId ?? ''}
                onChange={(event) => append({ type: 'role.assigned', playerId: id, roleId: event.target.value || null })}
              >
                <option value="">No role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
              <TokenEditor player={player} suggestions={(player.roleId && game.roles[player.roleId]?.suggestedTokens) || []} />
              <Stack direction="row" gap={2}>
                <Button
                  size="sm"
                  variant={player.alive ? 'danger' : 'secondary'}
                  onClick={() => append({ type: 'player.alive', playerId: id, alive: !player.alive })}
                >
                  {player.alive ? 'Eliminate' : 'Revive'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => append({ type: 'player.removed', playerId: id })}>
                  Remove from game
                </Button>
              </Stack>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
