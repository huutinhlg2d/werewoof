import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getPreset, makeEvent, presetLoaded, reduce, type EventBody } from '@/domain';
import { NotesPanel } from './components/NotesPanel';
import { SubmissionsPanel } from './components/SubmissionsPanel';
import { VoteTally } from './components/VoteTally';

let at = 0;
const log = (bodies: EventBody[]) => bodies.map((body) => makeEvent(body, ++at));

const base: EventBody[] = [
  presetLoaded(getPreset('classic')!),
  { type: 'player.joined', playerId: 'a', name: 'Ann' },
  { type: 'player.joined', playerId: 'b', name: 'Bob' },
  { type: 'player.joined', playerId: 'c', name: 'Cat' },
  { type: 'phase.set', label: 'Vote', day: 1 },
];

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('SubmissionsPanel', () => {
  it('shows an empty state with nothing pending', () => {
    expect(html(<SubmissionsPanel game={reduce(log(base))} />)).toContain('Nothing waiting for you.');
  });

  it('lists pending submissions with the player, target and note, and resolved ones separately', () => {
    const game = reduce(
      log([
        ...base,
        { type: 'submission.created', playerId: 'a', kind: 'Use ability', targetId: 'b', text: 'please save' },
        { type: 'submission.created', playerId: 'c', kind: 'Other' },
      ]),
    );
    const resolvedGame = reduce([
      ...log(base),
      makeEvent({ type: 'submission.created', playerId: 'c', kind: 'Other' }, ++at, 'x1'),
      makeEvent({ type: 'submission.resolved', submissionId: 'x1', status: 'rejected' }, ++at),
    ]);

    const pending = html(<SubmissionsPanel game={game} />);
    expect(pending).toContain('Ann: Use ability → Bob');
    expect(pending).toContain('please save');
    expect(pending).toContain('Approve');
    expect(pending).toContain('Vote · day 1');

    const resolved = html(<SubmissionsPanel game={resolvedGame} />);
    expect(resolved).toContain('Resolved');
    expect(resolved).toContain('rejected');
    expect(resolved).not.toContain('Approve');
  });
});

describe('VoteTally', () => {
  const vote = (playerId: string, targetId: string): EventBody => ({ type: 'submission.created', playerId, kind: 'Vote', targetId });

  it('renders nothing without votes', () => {
    expect(html(<VoteTally game={reduce(log(base))} />)).toBe('');
  });

  it('shows counts and voters, most voted first', () => {
    const game = reduce(log([...base, vote('a', 'c'), vote('b', 'c'), vote('c', 'a')]));
    const markup = html(<VoteTally game={game} />);

    expect(markup.indexOf('Cat')).toBeLessThan(markup.indexOf('Ann'));
    expect(markup).toContain('Ann, Bob');
    expect(markup).toContain('Eliminate');
  });

  it('disables eliminating someone already out', () => {
    const game = reduce(log([...base, vote('a', 'b'), { type: 'player.alive', playerId: 'b', alive: false }]));

    expect(html(<VoteTally game={game} />)).toMatch(/<button[^>]*disabled[^>]*>Eliminate/);
  });
});

describe('NotesPanel', () => {
  it('lists notes newest first with phase and player, and offers every player as a recipient', () => {
    const game = reduce(
      log([
        ...base,
        { type: 'note.added', noteId: 'n1', text: 'first note' },
        { type: 'note.added', noteId: 'n2', text: 'second note', playerId: 'a' },
      ]),
    );
    const markup = html(<NotesPanel game={game} />);

    expect(markup.indexOf('second note')).toBeLessThan(markup.indexOf('first note'));
    expect(markup).toContain('Vote · day 1 · Ann');
    expect(markup).toContain('Everyone');
    expect(markup).toContain('>Cat<');
  });
});
