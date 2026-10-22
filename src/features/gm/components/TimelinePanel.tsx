import { createLookup, describeEvent, eventStatuses, type GameEvent } from '@/domain';
import { Badge, Button, Card, Stack } from '@/ui';
import { useGmStore } from '../store';

const formatTime = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Every action, newest first. Undo adds a void event, so nothing is lost and an undo can itself be undone. */
export function TimelinePanel({ events }: { events: GameEvent[] }) {
  const toggleVoid = useGmStore((s) => s.toggleVoid);
  const lookup = createLookup(events);
  const statuses = eventStatuses(events);
  // Void events are the undo machinery, not game history.
  const rows = events.filter((event) => event.type !== 'event.voided').reverse();

  if (rows.length === 0) return <Card>Nothing has happened yet.</Card>;

  return (
    <Stack gap={2}>
      {rows.map((event) => {
        const status = statuses.get(event.id)!;
        return (
          <Card key={event.id}>
            <Stack gap={2}>
              <Stack direction="row" justify="space-between" align="center" gap={2}>
                <small>{formatTime(event.at)}</small>
                {!status.active && <Badge tone="danger">Undone</Badge>}
              </Stack>
              <span style={status.active ? undefined : { textDecoration: 'line-through', opacity: 0.6 }}>
                {describeEvent(event, lookup)}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggleVoid(status.active ? event.id : status.undoneBy!)}
              >
                {status.active ? 'Undo' : 'Restore'}
              </Button>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
