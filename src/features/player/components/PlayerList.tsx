import type { PlayerView } from '@/domain';
import { Badge, Card, Stack } from '@/ui';

export interface PlayerListProps {
  players: PlayerView['players'];
  meId: string;
}

export function PlayerList({ players, meId }: PlayerListProps) {
  return (
    <Stack gap={2} asChild>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {players.map((player) => (
          <li key={player.id}>
            <Card>
              <Stack direction="row" justify="space-between" align="center">
                <span style={player.alive ? undefined : { textDecoration: 'line-through' }}>
                  {player.name}
                  {player.id === meId && ' (you)'}
                </span>
                <Badge tone={player.alive ? 'success' : 'danger'}>{player.alive ? 'Alive' : 'Eliminated'}</Badge>
              </Stack>
            </Card>
          </li>
        ))}
      </ul>
    </Stack>
  );
}
