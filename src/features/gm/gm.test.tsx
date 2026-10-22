import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getPreset, makeEvent, presetLoaded, reduce, type EventBody } from '@/domain';
import { JoinCard, joinUrl } from './components/JoinCard';
import { NightPanel } from './components/NightPanel';
import { PhasePanel } from './components/PhasePanel';
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

  it('PlayersPanel offers eliminate/revive and the role suggested tokens', () => {
    const withWitch = [
      ...events,
      makeEvent({ type: 'role.assigned', playerId: 'b', roleId: 'witch' }, 9),
      makeEvent({ type: 'player.alive', playerId: 'a', alive: false }, 10),
    ];
    const markup = renderToStaticMarkup(<PlayersPanel game={reduce(withWitch)} online={[]} />);

    expect(markup).toContain('Revive');
    expect(markup).toContain('Eliminate');
    expect(markup).toContain('+ Heal potion');
    expect(markup).toContain('+ Poison potion');
  });

  it('PhasePanel suggests the next phase and the day it falls on', () => {
    const atVote = [...events, makeEvent({ type: 'phase.set', label: 'Vote', day: 2 }, 9)];
    const markup = renderToStaticMarkup(<PhasePanel game={reduce(atVote)} />);

    expect(markup).toContain('Next: Night');
    expect(markup).toContain('(day 3)');
    expect(markup).toContain('Day 2');
  });

  it('NightPanel lists acting roles in night order with holders and notes', () => {
    const night = [
      ...events,
      makeEvent({ type: 'phase.set', label: 'Night', day: 1 }, 9),
      makeEvent({ type: 'note.added', noteId: 'n1', text: 'looked at Bob', playerId: 'a' }, 10),
    ];
    const markup = renderToStaticMarkup(<NightPanel game={reduce(night)} />);

    expect(markup.indexOf('Seer')).toBeLessThan(markup.indexOf('Werewolf'));
    expect(markup).not.toContain('Villager');
    expect(markup).toContain('looked at Bob');
    expect(markup).toContain('Noted');
    expect(markup).toContain('Nobody holds this role.');
  });
});
