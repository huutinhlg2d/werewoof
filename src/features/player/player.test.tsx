import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PlayerView } from '@/domain';
import { ActionPanel } from './components/ActionPanel';
import { Inbox } from './components/Inbox';
import { PhaseBanner } from './components/PhaseBanner';
import { PlayerList } from './components/PlayerList';
import { RoleCard } from './components/RoleCard';
import { TokenList } from './components/TokenList';

const view: PlayerView = {
  me: { id: 'a', name: 'Ann', alive: true, role: { id: 'seer', name: 'Seer', description: 'Peek at someone.' }, tokens: [] },
  phase: { label: 'Night', day: 2 },
  players: [
    { id: 'a', name: 'Ann', alive: true },
    { id: 'b', name: 'Bob', alive: false },
  ],
  messages: [
    { id: 'm1', to: 'all', text: 'Dawn breaks', at: 1 },
    { id: 'm2', to: 'a', text: 'You saw a wolf', at: 2 },
  ],
  submissions: [{ id: 's1', playerId: 'a', kind: 'Vote', targetId: 'b', status: 'approved', phase: { label: 'Vote', day: 1 }, at: 3 }],
};

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('player components', () => {
  it('RoleCard keeps the role out of the DOM until held', () => {
    const markup = html(<RoleCard role={view.me.role} />);

    expect(markup).toContain('Hold to reveal');
    expect(markup).not.toContain('Seer');
    expect(markup).not.toContain('Peek at someone.');
  });

  it('RoleCard explains when no role is assigned yet', () => {
    expect(html(<RoleCard role={null} />)).toContain('Waiting for the Game Master');
  });

  it('PhaseBanner shows day, phase and alive state', () => {
    const markup = html(<PhaseBanner phase={view.phase} alive={false} />);

    expect(markup).toContain('Day 2');
    expect(markup).toContain('Night');
    expect(markup).toContain('Eliminated');
  });

  it('PhaseBanner omits the day before the game starts', () => {
    expect(html(<PhaseBanner phase={{ label: 'Lobby', day: 0 }} alive />)).not.toContain('Day');
  });

  it('PlayerList marks you and eliminated players', () => {
    const markup = html(<PlayerList players={view.players} meId="a" />);

    expect(markup).toContain('Ann (you)');
    expect(markup).toContain('Eliminated');
  });

  it('TokenList shows tokens with notes, or an empty state', () => {
    expect(html(<TokenList tokens={[{ id: 't', label: 'Heal potion', note: 'one use' }]} />)).toContain('Heal potion');
    expect(html(<TokenList tokens={[]} />)).toContain('nothing');
  });

  it('Inbox lists newest first and tags private messages', () => {
    const markup = html(<Inbox messages={view.messages} />);

    expect(markup.indexOf('You saw a wolf')).toBeLessThan(markup.indexOf('Dawn breaks'));
    expect(markup).toContain('Private');
    expect(html(<Inbox messages={[]} />)).toContain('No messages');
  });

  it('ActionPanel shows submissions with the target name and status, and disables submitting when dead', () => {
    const markup = html(<ActionPanel view={view} onSubmit={() => {}} />);
    expect(markup).toContain('Vote → Bob');
    expect(markup).toContain('approved');

    const dead = html(<ActionPanel view={{ ...view, me: { ...view.me, alive: false } }} onSubmit={() => {}} />);
    expect(dead).toMatch(/<button[^>]*disabled[^>]*>Submit an action/);
  });
});
