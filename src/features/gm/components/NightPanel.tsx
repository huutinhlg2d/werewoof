import { orderBy } from 'lodash-es';
import { newId, type GameState } from '@/domain';
import { Badge, Card, Stack } from '@/ui';
import { useGmStore } from '../store';
import { QuickNote } from './QuickNote';

/** Roles that act at night, in preset order, each with a free-text log per holder for the current day. */
export function NightPanel({ game }: { game: GameState }) {
  const append = useGmStore((s) => s.append);
  const actingRoles = orderBy(
    Object.values(game.roles).filter((role) => role.nightOrder !== undefined),
    'nightOrder',
  );

  if (actingRoles.length === 0) return <Card>The loaded preset has no night roles.</Card>;

  return (
    <Stack>
      {actingRoles.map((role) => {
        const holders = game.playerOrder.map((id) => game.players[id]).filter((player) => player.roleId === role.id);

        return (
          <Card key={role.id}>
            <Stack>
              <strong>{role.name}</strong>
              {holders.length === 0 && <small>Nobody holds this role.</small>}
              {holders.map((player) => {
                const notes = game.notes.filter((note) => note.playerId === player.id && note.phase.day === game.phase.day);
                return (
                  <Stack key={player.id} gap={2}>
                    <Stack direction="row" justify="space-between" align="center">
                      <span style={player.alive ? undefined : { textDecoration: 'line-through' }}>{player.name}</span>
                      <Badge tone={notes.length > 0 ? 'success' : 'neutral'}>{notes.length > 0 ? 'Noted' : 'No note'}</Badge>
                    </Stack>
                    {notes.map((note) => (
                      <small key={note.id}>
                        {note.phase.label}: {note.text}
                      </small>
                    ))}
                    <QuickNote
                      label={`What did ${player.name} do?`}
                      onSubmit={(text) => append({ type: 'note.added', noteId: newId(), text, playerId: player.id })}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
