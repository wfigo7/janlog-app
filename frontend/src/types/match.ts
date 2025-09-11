export type GameMode = 'three' | 'four';
export type EntryMethod = 'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only';

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