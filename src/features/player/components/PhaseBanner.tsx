import type { PhaseState } from '@/domain';
import { Badge, Card, Stack } from '@/ui';

export interface PhaseBannerProps {
  phase: PhaseState;
  alive: boolean;
}

export function PhaseBanner({ phase, alive }: PhaseBannerProps) {
  return (
    <Card tone="raised">
      <Stack direction="row" justify="space-between" align="center">
        <div>
          {phase.day > 0 && <small>Day {phase.day}</small>}
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{phase.label}</h1>
        </div>
        <Badge tone={alive ? 'success' : 'danger'}>{alive ? 'Alive' : 'Eliminated'}</Badge>
      </Stack>
    </Card>
  );
}
