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
  venueName?: string;
  memo?: string;
  floatingCount?: number;  // 浮き人数（浮きウマルール使用時のみ記録）
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
  venueName?: string;
  memo?: string;
  floatingCount?: number;  // 浮き人数（浮きウマルール使用時のみ）
}