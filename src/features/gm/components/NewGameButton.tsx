import { useState } from 'react';
import { Button, Dialog, Stack } from '@/ui';
import { useGmStore } from '../store';

export function NewGameButton() {
  const restart = useGmStore((s) => s.restart);
  const reset = useGmStore((s) => s.reset);
  const [open, setOpen] = useState(false);

  const run = (action: () => void) => () => {
    action();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="ghost">Start a new game</Button>}
      title="Start a new game"
      description="Neither option can be undone."
    >
      <Stack>
        <Button onClick={run(restart)}>Keep players and preset</Button>
        <small>Same room and players. Roles, tokens, alive state, phase, notes, messages and votes are cleared.</small>
        <Button variant="danger" onClick={run(reset)}>
          Clear everything
        </Button>
        <small>Removes every player and opens a new room. Players must join again.</small>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Keep playing
        </Button>
      </Stack>
    </Dialog>
  );
}
