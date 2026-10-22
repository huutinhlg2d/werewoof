import { useEffect, useState } from 'react';
import type { Id } from '@/domain';
import { HostSession } from '@/net/host';
import { openRoom } from '@/net/peer';
import { gameOf, useGmStore } from './store';

export type HostStatus = 'opening' | 'open' | 'error';

/** Opens the room and keeps connected players' views in sync with the event log. */
export function useHost() {
  const epoch = useGmStore((s) => s.epoch);
  const [attempt, setAttempt] = useState(0);
  // Results are tagged with the run that produced them, so a new run reads as "opening" without resetting state in the effect.
  const runKey = `${epoch}:${attempt}`;
  const [result, setResult] = useState<{ key: string; status: HostStatus }>({ key: '', status: 'opening' });
  const [presence, setPresence] = useState<{ key: string; ids: Id[] }>({ key: '', ids: [] });

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    const store = useGmStore;

    const host = new HostSession({
      getState: () => gameOf(store.getState().events),
      append: (body) => store.getState().append(body),
      sessions: store.getState().sessions,
      onSessionsChange: (sessions) => store.getState().setSessions(sessions),
      onPresenceChange: (ids) => setPresence({ key: runKey, ids }),
    });

    openRoom(store.getState().roomCode ?? undefined)
      .then((room) => {
        if (cancelled) {
          room.destroy();
          return;
        }
        store.getState().setRoomCode(room.code);
        room.onLink((link) => host.attach(link));
        const unsubscribe = store.subscribe((state, previous) => {
          if (state.events !== previous.events) host.broadcast();
        });
        cleanup = () => {
          unsubscribe();
          room.destroy();
        };
        setResult({ key: runKey, status: 'open' });
      })
      .catch(() => !cancelled && setResult({ key: runKey, status: 'error' }));

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [runKey]);

  return {
    status: result.key === runKey ? result.status : 'opening',
    online: presence.key === runKey ? presence.ids : [],
    retry: () => setAttempt((n) => n + 1),
  };
}
