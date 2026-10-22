import { useState, type FormEvent } from 'react';
import type { PlayerView } from '@/domain';
import { Badge, Button, Card, Input, Select, Sheet, Stack } from '@/ui';

// Free-text `kind` keeps the app out of the rules; these are only shortcuts.
const KINDS = ['Vote', 'Use ability', 'Other'];
const STATUS_TONE = { pending: 'neutral', approved: 'success', rejected: 'danger' } as const;

export interface ActionPanelProps {
  view: PlayerView;
  onSubmit: (kind: string, targetId?: string, text?: string) => void;
}

export function ActionPanel({ view, onSubmit }: ActionPanelProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(KINDS[0]);
  const [targetId, setTargetId] = useState('');
  const [text, setText] = useState('');

  const nameOf = (id?: string) => view.players.find((player) => player.id === id)?.name;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(kind, targetId || undefined, text.trim() || undefined);
    setTargetId('');
    setText('');
    setOpen(false);
  };

  return (
    <Stack>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        trigger={<Button disabled={!view.me.alive}>Submit an action</Button>}
        title="Submit an action"
        description="The Game Master decides whether it counts."
      >
        <form onSubmit={submit}>
          <Stack>
            <Select label="Type" value={kind} onChange={(event) => setKind(event.target.value)}>
              {KINDS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
            <Select label="Target" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">No target</option>
              {view.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                  {player.alive ? '' : ' (eliminated)'}
                </option>
              ))}
            </Select>
            <Input label="Note (optional)" value={text} maxLength={280} onChange={(event) => setText(event.target.value)} />
            <Button type="submit" fullWidth>
              Send to the Game Master
            </Button>
          </Stack>
        </form>
      </Sheet>

      {[...view.submissions].reverse().map((submission) => (
        <Card key={submission.id}>
          <Stack direction="row" justify="space-between" align="center" gap={2}>
            <span>
              {submission.kind}
              {submission.targetId && ` → ${nameOf(submission.targetId) ?? 'unknown'}`}
            </span>
            <Badge tone={STATUS_TONE[submission.status]}>{submission.status}</Badge>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
