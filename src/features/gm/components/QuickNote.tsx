import { useState, type FormEvent } from 'react';
import { Button, Input, Stack } from '@/ui';

export interface QuickNoteProps {
  label: string;
  onSubmit: (text: string) => void;
}

/** One-line free text that clears after submit; the app never interprets what is written. */
export function QuickNote({ label, onSubmit }: QuickNoteProps) {
  const [text, setText] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <form onSubmit={submit}>
      <Stack direction="row" gap={2} align="flex-end">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input label={label} value={text} maxLength={280} onChange={(event) => setText(event.target.value)} />
        </div>
        <Button type="submit" variant="secondary" disabled={!text.trim()}>
          Add
        </Button>
      </Stack>
    </form>
  );
}
