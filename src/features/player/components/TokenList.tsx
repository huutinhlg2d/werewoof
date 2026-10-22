import type { Token } from '@/domain';
import { Badge, Card, Stack } from '@/ui';

export function TokenList({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) return <Card>You hold nothing right now.</Card>;

  return (
    <Card>
      <Stack gap={2}>
        <strong>You have</strong>
        {tokens.map((token) => (
          <Stack key={token.id} direction="row" gap={2} align="center" wrap>
            <Badge tone="accent">{token.label}</Badge>
            {token.note && <small>{token.note}</small>}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
