import type { Link } from './link';

/** In-memory duplex pair for tests; delivery is synchronous. `a` sends `A`, `b` sends `B`. */
export function createLinkPair<A, B>(): [Link<A>, Link<B>] {
  type Handlers = { message: (raw: unknown) => void; close: () => void };
  const noop = () => {};
  const handlers: Record<'a' | 'b', Handlers> = {
    a: { message: noop, close: noop },
    b: { message: noop, close: noop },
  };
  let closed = false;

  const closeBoth = () => {
    if (closed) return;
    closed = true;
    handlers.a.close();
    handlers.b.close();
  };

  const side = <Out>(self: 'a' | 'b', other: 'a' | 'b'): Link<Out> => ({
    send: (message) => {
      if (!closed) handlers[other].message(JSON.parse(JSON.stringify(message)));
    },
    close: closeBoth,
    onMessage: (handler) => {
      handlers[self].message = handler;
    },
    onClose: (handler) => {
      handlers[self].close = handler;
    },
  });

  return [side<A>('a', 'b'), side<B>('b', 'a')];
}
