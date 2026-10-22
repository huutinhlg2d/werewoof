import type { ClientSession } from '@/net/client';

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'setItem' | 'removeItem'>;

const sessionKey = (code: string) => `werewoof:session:${code}`;
const NAME_KEY = 'werewoof:name';

/** Per-room seat so a refresh or reopened tab reclaims the same player. */
export function loadSession(code: string, storage: ReadStorage = localStorage): ClientSession | null {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(sessionKey(code)) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { playerId, token, name } = parsed as Record<string, unknown>;
    return typeof playerId === 'string' && typeof token === 'string' && typeof name === 'string'
      ? { playerId, token, name }
      : null;
  } catch {
    return null;
  }
}

export function saveSession(code: string, session: ClientSession | null, storage: WriteStorage = localStorage): void {
  if (session) storage.setItem(sessionKey(code), JSON.stringify(session));
  else storage.removeItem(sessionKey(code));
}

export const loadName = (storage: ReadStorage = localStorage): string => storage.getItem(NAME_KEY) ?? '';

export const saveName = (name: string, storage: WriteStorage = localStorage): void => storage.setItem(NAME_KEY, name);
