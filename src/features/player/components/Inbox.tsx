import type { Message } from '@/domain';
import { Badge, Card, Stack } from '@/ui';

const formatTime = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function Inbox({ messages }: { messages: Message[] }) {
  if (messages.length === 0) return <Card>No messages from the Game Master yet.</Card>;

  return (
    <Stack gap={2}>
      {[...messages].reverse().map((message) => (
        <Card key={message.id}>
          <Stack gap={2}>
            <Stack direction="row" justify="space-between" align="center">
              <Badge tone={message.to === 'all' ? 'neutral' : 'accent'}>{message.to === 'all' ? 'Everyone' : 'Private'}</Badge>
              <small>{formatTime(message.at)}</small>
            </Stack>
            <span>{message.text}</span>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
