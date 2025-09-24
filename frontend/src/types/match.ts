import { GameMode, EntryMethod } from './common';

export { EntryMethod };

export interface Match {
  matchId: string;
  date: string;
  gameMode: GameMode;
  entryMethod: EntryMethod;
  rulesetId: string;
  rank: number;
  finalPoints?: number;
  rawScore?: number;
  chipCount?: number;
  venueId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchInput {
  date: string; // ISO 8601形式の対局日（必須）
  gameMode: GameMode;
  entryMethod: EntryMethod;
  rulesetId: string;
  rank: number;
  finalPoints?: number;
  rawScore?: number;
  chipCount?: number;
  venueId?: string;
  memo?: string;
}