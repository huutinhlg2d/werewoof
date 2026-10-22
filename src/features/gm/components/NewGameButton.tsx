import { useState } from 'react';
import { Button, Dialog, Stack } from '@/ui';
import { useGmStore } from '../store';

export function NewGameButton() {
  const reset = useGmStore((s) => s.reset);
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="ghost">Start a new game</Button>}
      title="Start a new game?"
      description="This clears every player, note and event and opens a new room. Players must join again."
    >
      <Stack>
        <Button
          variant="danger"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Clear everything
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Keep playing
        </Button>
      </Stack>
    </Dialog>
  );
}
