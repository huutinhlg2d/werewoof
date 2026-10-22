import { describe, expect, it } from 'vitest';
import { loadName, loadSession, saveName, saveSession } from './storage';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => void (data[key] = value),
    removeItem: (key: string) => void delete data[key],
  };
}

describe('player storage', () => {
  it('round-trips a session per room code', () => {
    const storage = fakeStorage();
    const session = { playerId: 'p1', token: 't1', name: 'Ann' };
    saveSession('ABCDE', session, storage);

    expect(loadSession('ABCDE', storage)).toEqual(session);
    expect(loadSession('ZZZZZ', storage)).toBeNull();
  });

  it('clears a session', () => {
    const storage = fakeStorage();
    saveSession('ABCDE', { playerId: 'p1', token: 't1', name: 'Ann' }, storage);
    saveSession('ABCDE', null, storage);

    expect(loadSession('ABCDE', storage)).toBeNull();
  });

  it.each(['not json', '{"playerId":1}', '[]', 'null', '{"playerId":"p","token":"t"}'])(
    'ignores corrupt stored session %s',
    (raw) => {
      expect(loadSession('ABCDE', fakeStorage({ 'werewoof:session:ABCDE': raw }))).toBeNull();
    },
  );

  it('remembers the display name', () => {
    const storage = fakeStorage();
    expect(loadName(storage)).toBe('');
    saveName('Ann', storage);
    expect(loadName(storage)).toBe('Ann');
  });
});
