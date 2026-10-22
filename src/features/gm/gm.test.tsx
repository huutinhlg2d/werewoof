import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getPreset, makeEvent, presetLoaded, reduce, type EventBody } from '@/domain';
import { JoinCard, joinUrl } from './components/JoinCard';
import { PlayersPanel } from './components/PlayersPanel';

const events = (
  [
    presetLoaded(getPreset('classic')!),
    { type: 'player.joined', playerId: 'a', name: 'Ann' },
    { type: 'player.joined', playerId: 'b', name: 'Bob' },
    { type: 'role.assigned', playerId: 'a', roleId: 'seer' },
  ] satisfies EventBody[]
).map((body, i) => makeEvent(body, i));

describe('gm components', () => {
  it('joinUrl builds a hash link under the deploy base', () => {
    expect(joinUrl('https://x.github.io/werewoof/', 'ABCDE')).toBe('https://x.github.io/werewoof/#/join/ABCDE');
  });

  it('JoinCard explains opening and error states', () => {
    expect(renderToStaticMarkup(<JoinCard code={null} status="opening" onRetry={() => {}} />)).toContain('Opening room');
    expect(renderToStaticMarkup(<JoinCard code={null} status="error" onRetry={() => {}} />)).toContain('Try again');
  });

  it('PlayersPanel lists players with presence and their selected role', () => {
    const markup = renderToStaticMarkup(<PlayersPanel game={reduce(events)} online={['a']} />);

    expect(markup).toContain('Ann');
    expect(markup).toContain('Online');
    expect(markup).toContain('Offline');
    expect(markup).toMatch(/<option value="seer" selected/);
  });

  it('PlayersPanel shows an empty state', () => {
    expect(renderToStaticMarkup(<PlayersPanel game={reduce([])} online={[]} />)).toContain('No players yet');
  });
});
