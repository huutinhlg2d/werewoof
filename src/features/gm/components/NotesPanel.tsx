import { useState } from 'react';
import { newId, type GameState } from '@/domain';
import { Card, Select, Stack } from '@/ui';
import { useGmStore } from '../store';
import { QuickNote } from './QuickNote';

export function NotesPanel({ game }: { game: GameState }) {
  const append = useGmStore((s) => s.append);
  const [selected, setTo] = useState('all');
  // The chosen player may have been removed since.
  const to = selected === 'all' || game.players[selected] ? selected : 'all';
  const notes = [...game.notes].reverse();

  return (
    <Stack>
      <Card>
        <Stack>
          <strong>Message players</strong>
          <Select label="To" value={to} onChange={(event) => setTo(event.target.value)}>
            <option value="all">Everyone</option>
            {game.playerOrder.map((id) => (
              <option key={id} value={id}>
                {game.players[id].name}
              </option>
            ))}
          </Select>
          <QuickNote label="Message" onSubmit={(text) => append({ type: 'message.sent', to, text })} />
        </Stack>
      </Card>

      <Card>
        <Stack>
          <strong>Your notes</strong>
          <small>Only you see these.</small>
          <QuickNote label="New note" onSubmit={(text) => append({ type: 'note.added', noteId: newId(), text })} />
          {notes.map((note) => (
            <Stack key={note.id} gap={1}>
              <small>
                {note.phase.label}
                {note.phase.day > 0 && ` · day ${note.phase.day}`}
                {note.playerId && ` · ${game.players[note.playerId]?.name ?? 'Removed player'}`}
              </small>
              <span>{note.text}</span>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
