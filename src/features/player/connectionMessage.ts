import type { ConnectFailure } from '@/net/link';

const MESSAGES: Record<ConnectFailure, string> = {
  'room-not-found': 'Room not found. Check the code, and that the Game Master has the game open and the screen on.',
  timeout: 'Could not reach the room in time. Mobile data can block direct phone connections: try the same Wi-Fi as the Game Master.',
  network: 'Network problem while reaching the room.',
  'no-response': 'Reached the room, but the Game Master did not answer.',
};

export const connectionMessage = (error: ConnectFailure | null): string | null => (error ? MESSAGES[error] : null);
