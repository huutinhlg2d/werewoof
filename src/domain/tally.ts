import { orderBy } from 'lodash-es';
import type { Id, Submission } from './types';

export interface VoteTally {
  targetId: Id;
  voterIds: Id[];
}

/** Read-only helper: counts each player's latest non-rejected vote of the day. It never changes game state. */
export function tallyVotes(submissions: readonly Submission[], day: number): VoteTally[] {
  const latestByVoter = new Map<Id, Submission>();
  for (const submission of orderBy(submissions, 'at')) {
    if (submission.phase.day !== day || submission.kind.trim().toLowerCase() !== 'vote') continue;
    if (submission.status === 'rejected' || !submission.targetId) latestByVoter.delete(submission.playerId);
    else latestByVoter.set(submission.playerId, submission);
  }

  const byTarget = new Map<Id, Id[]>();
  for (const { playerId, targetId } of orderBy([...latestByVoter.values()], 'at')) {
    byTarget.set(targetId!, [...(byTarget.get(targetId!) ?? []), playerId]);
  }

  return orderBy(
    [...byTarget].map(([targetId, voterIds]) => ({ targetId, voterIds })),
    (tally) => tally.voterIds.length,
    'desc',
  );
}
