import { newId, type Player } from '@/domain';
import { Badge, Button, Stack } from '@/ui';
import { useGmStore } from '../store';
import { QuickNote } from './QuickNote';

export interface TokenEditorProps {
  player: Player;
  /** Role-suggested labels offered as one-tap additions. */
  suggestions: string[];
}

export function TokenEditor({ player, suggestions }: TokenEditorProps) {
  const append = useGmStore((s) => s.append);
  const addToken = (label: string) => append({ type: 'token.added', playerId: player.id, token: { id: newId(), label } });

  return (
    <Stack gap={2}>
      <strong>Tokens</strong>
      <Stack direction="row" wrap gap={2} align="center">
        {player.tokens.length === 0 && <small>None</small>}
        {player.tokens.map((token) => (
          <Badge key={token.id} tone="accent">
            {token.label}
            <button
              type="button"
              aria-label={`Remove ${token.label}`}
              onClick={() => append({ type: 'token.removed', playerId: player.id, tokenId: token.id })}
              style={{ all: 'unset', cursor: 'pointer', padding: '0 var(--space-1)' }}
            >
              ✕
            </button>
          </Badge>
        ))}
      </Stack>
      {suggestions.length > 0 && (
        <Stack direction="row" wrap gap={2}>
          {suggestions.map((label) => (
            <Button key={label} size="sm" variant="secondary" onClick={() => addToken(label)}>
              + {label}
            </Button>
          ))}
        </Stack>
      )}
      <QuickNote label="Custom token" onSubmit={addToken} />
    </Stack>
  );
}
