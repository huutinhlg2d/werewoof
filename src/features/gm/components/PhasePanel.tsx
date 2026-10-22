import { useState, type FormEvent } from 'react';
import { nextPhase, type GameState } from '@/domain';
import { Button, Card, Input, Stack } from '@/ui';
import { useGmStore } from '../store';

export function PhasePanel({ game }: { game: GameState }) {
  const append = useGmStore((s) => s.append);
  const [label, setLabel] = useState('');
  const [day, setDay] = useState('');

  const upcoming = nextPhase(game.phases, game.phase);
  const setPhase = (next: { label: string; day: number }) => append({ type: 'phase.set', ...next });

  const submitCustom = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    const parsedDay = Number.parseInt(day, 10);
    setPhase({ label: trimmed, day: Number.isNaN(parsedDay) ? game.phase.day : Math.max(0, parsedDay) });
    setLabel('');
    setDay('');
  };

  return (
    <Stack>
      <Card tone="raised">
        <Stack gap={2}>
          <small>{game.phase.day > 0 ? `Day ${game.phase.day}` : 'Not started'}</small>
          <strong style={{ fontSize: 'var(--font-size-lg)' }}>{game.phase.label}</strong>
          <Button size="lg" fullWidth disabled={game.phases.length === 0} onClick={() => setPhase(upcoming)}>
            Next: {upcoming.label}
            {upcoming.day !== game.phase.day && ` (day ${upcoming.day})`}
          </Button>
        </Stack>
      </Card>

      {game.phases.length > 0 && (
        <Card>
          <Stack gap={2}>
            <strong>Jump to</strong>
            <Stack direction="row" wrap gap={2}>
              {game.phases.map((phase) => (
                <Button
                  key={phase}
                  size="sm"
                  variant="secondary"
                  onClick={() => setPhase({ label: phase, day: Math.max(1, game.phase.day) })}
                >
                  {phase}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      <Card>
        <form onSubmit={submitCustom}>
          <Stack>
            <strong>Custom phase</strong>
            <Input label="Label" value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} />
            <Input
              label="Day (optional)"
              inputMode="numeric"
              value={day}
              onChange={(event) => setDay(event.target.value.replace(/\D/g, ''))}
              hint={`Leave empty to stay on day ${game.phase.day}.`}
            />
            <Button type="submit" variant="secondary" disabled={!label.trim()}>
              Set phase
            </Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
