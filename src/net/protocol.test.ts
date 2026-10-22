import { describe, expect, it } from 'vitest';
import { parseClientMessage, parseHostMessage } from './protocol';

describe('parseClientMessage', () => {
  it('accepts well-formed messages', () => {
    expect(parseClientMessage({ type: 'join', name: 'Ann' })).toEqual({ type: 'join', name: 'Ann', token: undefined });
    expect(parseClientMessage({ type: 'submit', kind: 'vote', targetId: 'p1' })).toMatchObject({ kind: 'vote', targetId: 'p1' });
    expect(parseClientMessage({ type: 'ping' })).toEqual({ type: 'ping' });
  });

  it.each([null, 'x', 5, {}, { type: 'nope' }, { type: 'join' }, { type: 'join', name: 1 }, { type: 'submit', kind: 'a'.repeat(41) }, { type: 'submit', kind: 'k', text: 't'.repeat(281) }])(
    'rejects %j',
    (raw) => {
      expect(parseClientMessage(raw)).toBeNull();
    },
  );
});

describe('parseHostMessage', () => {
  it('accepts known types only', () => {
    expect(parseHostMessage({ type: 'pong' })).toEqual({ type: 'pong' });
    expect(parseHostMessage({ type: 'evil' })).toBeNull();
    expect(parseHostMessage(null)).toBeNull();
  });
});
