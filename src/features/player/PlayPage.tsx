import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Page, Stack, Tabs } from '@/ui';
import { ActionPanel } from './components/ActionPanel';
import { Inbox } from './components/Inbox';
import { PhaseBanner } from './components/PhaseBanner';
import { PlayerList } from './components/PlayerList';
import { RoleCard } from './components/RoleCard';
import { TokenList } from './components/TokenList';
import { loadName, loadSession } from './storage';
import { useGameClient } from './useGameClient';

export function PlayPage() {
  const { code = '' } = useParams();
  const name = loadSession(code)?.name || loadName();

  // No name means the player skipped the join form (e.g. opened the URL directly).
  if (!name) return <Navigate to={`/join/${code}`} replace />;
  return <Room key={code} code={code} name={name} />;
}

function Room({ code, name }: { code: string; name: string }) {
  const { state, submit } = useGameClient(code, name);
  const [tab, setTab] = useState('me');
  const [seen, setSeen] = useState(0);
  const { view, status, rejected } = state;

  if (rejected) {
    return (
      <Page>
        <Card>
          <Stack>
            <strong>{rejected === 'removed' ? 'The Game Master removed you from this game.' : `Could not join: ${rejected}`}</strong>
            <Button asChild variant="secondary">
              <Link to="/">Back to start</Link>
            </Button>
          </Stack>
        </Card>
      </Page>
    );
  }

  if (!view) {
    return (
      <Page>
        <Card>
          <Stack>
            <strong>{status === 'connected' ? 'Joined. Waiting for the game…' : `Connecting to room ${code}…`}</strong>
            <small>Check the room code and that the Game Master has the game open.</small>
            <Button asChild variant="secondary">
              <Link to="/join">Use a different code</Link>
            </Button>
          </Stack>
        </Card>
      </Page>
    );
  }

  const unread = tab === 'inbox' ? 0 : Math.max(0, view.messages.length - seen);

  return (
    <Page>
      {status !== 'connected' && <Badge tone="danger">Reconnecting…</Badge>}
      <PhaseBanner phase={view.phase} alive={view.me.alive} />

      <Tabs.Root
        value={tab}
        onValueChange={(next) => {
          setTab(next);
          setSeen(view.messages.length);
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="me">Me</Tabs.Trigger>
          <Tabs.Trigger value="players">Players</Tabs.Trigger>
          <Tabs.Trigger value="inbox">Inbox{unread > 0 && ` (${unread})`}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="me">
          <Stack>
            <RoleCard role={view.me.role} />
            <TokenList tokens={view.me.tokens} />
            <ActionPanel view={view} onSubmit={submit} />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="players">
          <PlayerList players={view.players} meId={view.me.id} />
        </Tabs.Content>
        <Tabs.Content value="inbox">
          <Inbox messages={view.messages} />
        </Tabs.Content>
      </Tabs.Root>
    </Page>
  );
}
