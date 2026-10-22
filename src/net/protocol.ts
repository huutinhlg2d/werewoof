import type { Id, PlayerView } from '@/domain';

export const LIMITS = { name: 24, kind: 40, text: 280, pendingPerPlayer: 20 } as const;

export type ClientMessage =
  /** `token` proves a returning device owns an existing seat. */
  | { type: 'join'; name: string; token?: string }
  | { type: 'submit'; kind: string; targetId?: Id; text?: string }
  | { type: 'ping' };

export type HostMessage =
  | { type: 'joined'; playerId: Id; token: string }
  | { type: 'view'; view: PlayerView }
  | { type: 'rejected'; reason: string }
  | { type: 'pong' };

const isString = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;

const isOptionalString = (value: unknown, max: number) => value === undefined || isString(value, max);

/** Wire data is untrusted: anything malformed yields null and is dropped by the caller. */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const msg = raw as Record<string, unknown>;

  switch (msg.type) {
    case 'ping':
      return { type: 'ping' };
    case 'join':
      if (!isString(msg.name, LIMITS.name) || !isOptionalString(msg.token, 64)) return null;
      return { type: 'join', name: msg.name, token: msg.token as string | undefined };
    case 'submit':
      if (!isString(msg.kind, LIMITS.kind) || !isOptionalString(msg.targetId, 64) || !isOptionalString(msg.text, LIMITS.text)) {
        return null;
      }
      return { type: 'submit', kind: msg.kind, targetId: msg.targetId as string | undefined, text: msg.text as string | undefined };
    default:
      return null;
  }
}

const HOST_TYPES = new Set<HostMessage['type']>(['joined', 'view', 'rejected', 'pong']);

export function parseHostMessage(raw: unknown): HostMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const type = (raw as { type?: unknown }).type;
  return HOST_TYPES.has(type as HostMessage['type']) ? (raw as HostMessage) : null;
}
