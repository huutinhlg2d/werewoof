import { useEffect } from 'react';
import { getPreset, presetLoaded } from '@/domain';
import { Badge, Page, Stack, Tabs } from '@/ui';
import { JoinCard } from './components/JoinCard';
import { NewGameButton } from './components/NewGameButton';
import { NightPanel } from './components/NightPanel';
import { PhasePanel } from './components/PhasePanel';
import { PlayersPanel } from './components/PlayersPanel';
import { SetupPanel } from './components/SetupPanel';
import { gameOf, useGame, useGmStore } from './store';
import { useHost } from './useHost';

export function HostPage() {
  const game = useGame();
  const roomCode = useGmStore((s) => s.roomCode);
  const { status, online, retry } = useHost();

  // Load the classic preset when the game has none (first visit or after a reset).
  useEffect(() => {
    // Read the live store: a Strict Mode re-run still holds the stale render value.
    if (gameOf(useGmStore.getState().events).presetId) return;
    const classic = getPreset('classic');
    if (classic) useGmStore.getState().append(presetLoaded(classic));
  }, [game.presetId]);

  return (
    <Page>
      <Stack direction="row" justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Game Master</h1>
        <Badge tone="accent">{online.length} online</Badge>
      </Stack>

      <Tabs.Root defaultValue="lobby">
        <Tabs.List>
          <Tabs.Trigger value="lobby">Lobby</Tabs.Trigger>
          <Tabs.Trigger value="phase">Phase</Tabs.Trigger>
          <Tabs.Trigger value="night">Night</Tabs.Trigger>
          <Tabs.Trigger value="players">Players ({game.playerOrder.length})</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="lobby">
          <Stack>
            <JoinCard code={roomCode} status={status} onRetry={retry} />
            <SetupPanel game={game} />
            <NewGameButton />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="phase">
          <PhasePanel game={game} />
        </Tabs.Content>
        <Tabs.Content value="night">
          <NightPanel game={game} />
        </Tabs.Content>
        <Tabs.Content value="players">
          <PlayersPanel game={game} online={online} />
        </Tabs.Content>
      </Tabs.Root>
    </Page>
  );
}
