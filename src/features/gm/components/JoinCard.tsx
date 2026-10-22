import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Badge, Button, Card, Stack } from '@/ui';
import type { HostStatus } from '../useHost';

export const joinUrl = (baseUrl: string, code: string): string => `${baseUrl}#/join/${code}`;

export interface JoinCardProps {
  code: string | null;
  status: HostStatus;
  onRetry: () => void;
}

export function JoinCard({ code, status, onRetry }: JoinCardProps) {
  const [copied, setCopied] = useState(false);

  if (status === 'error') {
    return (
      <Card>
        <Stack>
          <strong>Could not open the room.</strong>
          <small>Check your connection; the room needs the public PeerJS broker.</small>
          <Button onClick={onRetry}>Try again</Button>
        </Stack>
      </Card>
    );
  }

  if (status === 'opening' || !code) return <Card>Opening room…</Card>;

  const url = joinUrl(window.location.origin + import.meta.env.BASE_URL, code);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card tone="raised">
      <Stack align="center">
        <Badge tone="success">Room open</Badge>
        <strong style={{ fontSize: '2.5rem', letterSpacing: '0.2em' }}>{code}</strong>
        <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          <QRCodeSVG value={url} size={160} />
        </div>
        <Button variant="secondary" onClick={copy}>
          {copied ? 'Copied' : 'Copy join link'}
        </Button>
      </Stack>
    </Card>
  );
}
