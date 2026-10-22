import { orderBy } from 'lodash-es';
import type { GameState, Submission } from '@/domain';
import { Badge, Button, Card, Stack } from '@/ui';
import { useGmStore } from '../store';
import { VoteTally } from './VoteTally';

const STATUS_TONE = { pending: 'neutral', approved: 'success', rejected: 'danger' } as const;

const nameOf = (game: GameState, id: string) => game.players[id]?.name ?? 'Removed player';

function describe(game: GameState, submission: Submission) {
  const target = submission.targetId ? ` → ${nameOf(game, submission.targetId)}` : '';
  return `${nameOf(game, submission.playerId)}: ${submission.kind}${target}`;
}

export function SubmissionsPanel({ game }: { game: GameState }) {
  const append = useGmStore((s) => s.append);
  const all = orderBy(Object.values(game.submissions), 'at');
  const pending = all.filter((submission) => submission.status === 'pending');
  const resolved = all.filter((submission) => submission.status !== 'pending').reverse();

  const resolve = (submissionId: string, status: 'approved' | 'rejected') =>
    append({ type: 'submission.resolved', submissionId, status });

  return (
    <Stack>
      <VoteTally game={game} />

      {pending.length === 0 && <Card>Nothing waiting for you.</Card>}
      {pending.map((submission) => (
        <Card key={submission.id}>
          <Stack>
            <Stack direction="row" justify="space-between" align="center" gap={2}>
              <strong>{describe(game, submission)}</strong>
              <Badge>
                {submission.phase.label}
                {submission.phase.day > 0 && ` · day ${submission.phase.day}`}
              </Badge>
            </Stack>
            {submission.text && <span>{submission.text}</span>}
            <Stack direction="row" gap={2}>
              <Button size="sm" onClick={() => resolve(submission.id, 'approved')}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => resolve(submission.id, 'rejected')}>
                Reject
              </Button>
            </Stack>
          </Stack>
        </Card>
      ))}

      {resolved.length > 0 && (
        <Stack gap={2}>
          <strong>Resolved</strong>
          {resolved.map((submission) => (
            <Card key={submission.id}>
              <Stack direction="row" justify="space-between" align="center" gap={2}>
                <span>{describe(game, submission)}</span>
                <Badge tone={STATUS_TONE[submission.status]}>{submission.status}</Badge>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
