import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { makeEvent, reduce, restartEvents, type EventBody, type GameEvent, type GameState, type Id } from '@/domain';

interface GmStore {
  roomCode: string | null;
  events: GameEvent[];
  /** Rejoin token -> player id, kept so players reclaim seats after a GM refresh. */
  sessions: Record<string, Id>;
  /** Bumped on reset so the host hook reopens a fresh room. */
  epoch: number;
  append(body: EventBody): void;
  appendMany(bodies: EventBody[]): void;
  /** Undo is another event, so it can itself be undone. */
  toggleVoid(eventId: Id): void;
  setRoomCode(code: string): void;
  setSessions(sessions: Record<string, Id>): void;
  /** New round with the same players, preset and room; history is replaced, so it cannot be undone. */
  restart(): void;
  /** Drops everything, players included, and opens a fresh room. */
  reset(): void;
}

export const useGmStore = create<GmStore>()(
  persist(
    (set) => ({
      roomCode: null,
      events: [],
      sessions: {},
      epoch: 0,
      append: (body) => set((s) => ({ events: [...s.events, makeEvent(body)] })),
      appendMany: (bodies) => set((s) => ({ events: [...s.events, ...bodies.map((body) => makeEvent(body))] })),
      toggleVoid: (eventId) => set((s) => ({ events: [...s.events, makeEvent({ type: 'event.voided', targetId: eventId })] })),
      setRoomCode: (roomCode) => set({ roomCode }),
      setSessions: (sessions) => set({ sessions }),
      restart: () =>
        set((s) => ({ events: restartEvents(gameOf(s.events)).map((body) => makeEvent(body)) })),
      reset: () => set((s) => ({ roomCode: null, events: [], sessions: {}, epoch: s.epoch + 1 })),
    }),
    {
      name: 'werewoof:gm',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ roomCode, events, sessions }) => ({ roomCode, events, sessions }),
    },
  ),
);

// Events are replaced immutably, so the array identity is a safe cache key.
const cache = new WeakMap<GameEvent[], GameState>();

export function gameOf(events: GameEvent[]): GameState {
  let game = cache.get(events);
  if (!game) {
    game = reduce(events);
    cache.set(events, game);
  }
  return game;
}

export const useGame = (): GameState => gameOf(useGmStore((s) => s.events));
