import { tallyVotes, type GameState } from '@/domain';
import { Badge, Button, Card, Stack } from '@/ui';
import { useGmStore } from '../store';

const nameOf = (game: GameState, id: string) => game.players[id]?.name ?? 'Removed player';

/** Counts are advice only: nothing happens until the GM taps Eliminate. */
export function VoteTally({ game }: { game: GameState }) {
  const append = useGmStore((s) => s.append);
  const tally = tallyVotes(Object.values(game.submissions), game.phase.day);

  if (tally.length === 0) return null;

  return (
    <Card tone="raised">
      <Stack>
        <strong>Votes, day {game.phase.day}</strong>
        {tally.map(({ targetId, voterIds }) => {
          const target = game.players[targetId];
          return (
            <Stack key={targetId} gap={2}>
              <Stack direction="row" justify="space-between" align="center">
                <span>
                  {nameOf(game, targetId)} <Badge tone="accent">{voterIds.length}</Badge>
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!target?.alive}
                  onClick={() => append({ type: 'player.alive', playerId: targetId, alive: false })}
                >
                  Eliminate
                </Button>
              </Stack>
              <small>{voterIds.map((id) => nameOf(game, id)).join(', ')}</small>
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}
