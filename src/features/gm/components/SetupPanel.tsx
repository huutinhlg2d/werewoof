import { useState } from 'react';
import { dealRoles, presetLoaded, presets, type EventBody, type GameState } from '@/domain';
import { Badge, Button, Card, Select, Stack } from '@/ui';
import { useGmStore } from '../store';

export function SetupPanel({ game }: { game: GameState }) {
  const appendMany = useGmStore((s) => s.appendMany);
  const [presetId, setPresetId] = useState(game.presetId ?? presets[0].id);
  const [pool, setPool] = useState<Record<string, number>>({});

  const roles = Object.values(game.roles);
  const total = roles.reduce((sum, role) => sum + (pool[role.id] ?? 0), 0);
  const playerCount = game.playerOrder.length;

  const applyPreset = () => {
    const preset = presets.find((candidate) => candidate.id === presetId);
    if (preset) appendMany([presetLoaded(preset)]);
    setPool({});
  };

  const deal = () => {
    const deals = dealRoles(game.playerOrder, pool);
    const dealt = new Set(deals.map((entry) => entry.playerId));
    const bodies: EventBody[] = deals.map(({ playerId, roleId }) => ({ type: 'role.assigned', playerId, roleId }));
    // Anyone left out of the deal loses a role from an earlier deal.
    for (const id of game.playerOrder) {
      if (!dealt.has(id) && game.players[id].roleId) bodies.push({ type: 'role.assigned', playerId: id, roleId: null });
    }
    appendMany(bodies);
  };

  const step = (roleId: string, delta: number) =>
    setPool((current) => ({ ...current, [roleId]: Math.max(0, (current[roleId] ?? 0) + delta) }));

  return (
    <Stack>
      <Card>
        <Stack>
          <Select label="Preset" value={presetId} onChange={(event) => setPresetId(event.target.value)}>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={applyPreset}>
            Apply preset
          </Button>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <Stack direction="row" justify="space-between" align="center">
            <strong>Role pool</strong>
            <Badge tone={total === playerCount ? 'success' : 'danger'}>
              {total} roles / {playerCount} players
            </Badge>
          </Stack>
          {roles.map((role) => (
            <Stack key={role.id} direction="row" justify="space-between" align="center">
              <span>{role.name}</span>
              <Stack direction="row" align="center" gap={2}>
                <Button size="sm" variant="secondary" aria-label={`Fewer ${role.name}`} onClick={() => step(role.id, -1)}>
                  −
                </Button>
                <span style={{ minWidth: '1.5rem', textAlign: 'center' }}>{pool[role.id] ?? 0}</span>
                <Button size="sm" variant="secondary" aria-label={`More ${role.name}`} onClick={() => step(role.id, 1)}>
                  +
                </Button>
              </Stack>
            </Stack>
          ))}
          <Button onClick={deal} disabled={total === 0 || playerCount === 0}>
            Deal roles randomly
          </Button>
          <small>The deal is a suggestion: you can still change any role in Players.</small>
        </Stack>
      </Card>
    </Stack>
  );
}
