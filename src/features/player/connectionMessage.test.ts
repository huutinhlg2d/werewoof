import { describe, expect, it } from 'vitest';
import { connectionMessage } from './connectionMessage';

describe('connectionMessage', () => {
  it('has nothing to say without an error', () => {
    expect(connectionMessage(null)).toBeNull();
  });

  it('points phones on mobile data to Wi-Fi when the connection times out', () => {
    expect(connectionMessage('timeout')).toContain('Wi-Fi');
  });

  it('tells the player to check the code when the room is missing', () => {
    expect(connectionMessage('room-not-found')).toContain('code');
  });
});
