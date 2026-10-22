import { useEffect, useState, useSyncExternalStore } from 'react';
import { GameClient } from '@/net/client';
import { connectToRoom } from '@/net/peer';
import { loadSession, saveSession } from './storage';

// Shorter sleeps keep the existing link; longer ones likely killed it before the heartbeat notices.
const STALE_AFTER_HIDDEN_MS = 5_000;

export function useGameClient(code: string, name: string) {
  const [client] = useState(
    () =>
      new GameClient({
        name,
        connect: () => connectToRoom(code),
        loadSession: () => loadSession(code),
        saveSession: (session) => saveSession(code, session),
      }),
  );

  useEffect(() => {
    let hiddenAt: number | null = null;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null && Date.now() - hiddenAt > STALE_AFTER_HIDDEN_MS) {
        client.reconnectNow();
      }
    };
    const onOnline = () => client.reconnectNow();

    client.start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      client.stop();
    };
  }, [client]);

  const state = useSyncExternalStore(client.subscribe, client.getState);
  return { state, submit: client.submit.bind(client) };
}
