export type Id = string;

export interface RoleDef {
  id: Id;
  name: string;
  description: string;
  /** Lower acts earlier at night; omitted means the role does not act. */
  nightOrder?: number;
  /** Labels the GM may hand to the holder, e.g. "Heal potion". */
  suggestedTokens?: string[];
}

export interface Preset {
  id: Id;
  name: string;
  roles: RoleDef[];
  /** Suggested phase cycle; the GM can still set any label. */
  phases: string[];
}

export interface Token {
  id: Id;
  label: string;
  note?: string;
}

export interface Player {
  id: Id;
  name: string;
  roleId: Id | null;
  alive: boolean;
  tokens: Token[];
}

export interface PhaseState {
  label: string;
  day: number;
}

/** GM-only scratch note, optionally about one player. */
export interface Note {
  id: Id;
  text: string;
  playerId?: Id;
  phase: PhaseState;
  at: number;
}

export interface Message {
  id: Id;
  to: Id | 'all';
  text: string;
  at: number;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/** A player's request (vote, ability use); `kind` is free text so no mechanic is hardcoded. */
export interface Submission {
  id: Id;
  playerId: Id;
  kind: string;
  targetId?: Id;
  text?: string;
  status: SubmissionStatus;
  phase: PhaseState;
  at: number;
}

export interface GameState {
  presetId: Id | null;
  roles: Record<Id, RoleDef>;
  phases: string[];
  players: Record<Id, Player>;
  playerOrder: Id[];
  phase: PhaseState;
  notes: Note[];
  messages: Message[];
  submissions: Record<Id, Submission>;
}
