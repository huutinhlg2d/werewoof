import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { makeEvent, type EventBody } from '@/domain';
import { TimelinePanel } from './components/TimelinePanel';

const log = (...bodies: EventBody[]) => bodies.map((body, i) => makeEvent(body, i + 1, `e${i + 1}`));
const html = (events: ReturnType<typeof log>) => renderToStaticMarkup(<TimelinePanel events={events} />);

describe('TimelinePanel', () => {
  it('shows an empty state', () => {
    expect(html([])).toContain('Nothing has happened yet.');
  });

  it('lists events newest first and offers Undo', () => {
    const markup = html(
      log({ type: 'player.joined', playerId: 'a', name: 'Ann' }, { type: 'player.alive', playerId: 'a', alive: false }),
    );

    expect(markup.indexOf('Ann was eliminated')).toBeLessThan(markup.indexOf('Ann joined'));
    expect(markup).toContain('Undo');
    expect(markup).not.toContain('Undone');
  });

  it('marks an undone event, offers Restore, and hides the void event itself', () => {
    const markup = html(
      log(
        { type: 'player.joined', playerId: 'a', name: 'Ann' },
        { type: 'player.alive', playerId: 'a', alive: false },
        { type: 'event.voided', targetId: 'e2' },
      ),
    );

    expect(markup).toContain('Undone');
    expect(markup).toContain('Restore');
    expect(markup).not.toContain('Undid an earlier event');
  });

  it('shows a restored event as active again', () => {
    const markup = html(
      log(
        { type: 'player.joined', playerId: 'a', name: 'Ann' },
        { type: 'player.alive', playerId: 'a', alive: false },
        { type: 'event.voided', targetId: 'e2' },
        { type: 'event.voided', targetId: 'e3' },
      ),
    );

    expect(markup).not.toContain('Undone');
    expect(markup).not.toContain('Restore');
  });
});
