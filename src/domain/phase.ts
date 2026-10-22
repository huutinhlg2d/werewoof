import { shuffle } from 'lodash-es';
import type { Id, PhaseState } from './types';

/** Suggests the next phase in the preset cycle; the GM can always set any label instead. */
export function nextPhase(phases: readonly string[], current: PhaseState): PhaseState {
  if (phases.length === 0) return current;

  const index = phases.indexOf(current.label);
  if (index === -1) return { label: phases[0], day: Math.max(1, current.day) };

  const next = (index + 1) % phases.length;
  return { label: phases[next], day: next === 0 ? current.day + 1 : current.day };
}

/** Expands role counts into a shuffled deal; extra players stay unassigned, extra roles are dropped. */
export function dealRoles(
  playerIds: readonly Id[],
  pool: Readonly<Record<Id, number>>,
  shuffleFn: <T>(items: T[]) => T[] = shuffle,
): { playerId: Id; roleId: Id }[] {
  const roleIds = shuffleFn(Object.entries(pool).flatMap(([roleId, count]) => Array<Id>(Math.max(0, count)).fill(roleId)));
  return playerIds.slice(0, roleIds.length).map((playerId, i) => ({ playerId, roleId: roleIds[i] }));
}
