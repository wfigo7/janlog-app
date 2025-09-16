import { GameMode, EntryMethod } from './common';

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