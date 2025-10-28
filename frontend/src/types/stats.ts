/**
 * 統計データの型定義
 */

export interface RankDistribution {
  first: number;    // 1位回数
  second: number;   // 2位回数
  third: number;    // 3位回数
  fourth: number;   // 4位回数
}

export interface StatsSummary {
  // 基本統計
  count: number;          // 対局数（半荘数）
  avgRank: number;        // 平均順位（平均着順）
  avgScore: number;       // 平均ポイント（1対局あたりの平均ポイント）
  totalPoints: number;    // 累積ポイント（スコア）
  chipTotal?: number;     // チップ合計（チップありルールでの対局がある場合のみ）
  
  // 順位分布
  rankDistribution: RankDistribution;  // 各順位の回数
  
  // 率系統計
  topRate: number;        // トップ率（%）
  secondRate: number;     // 2位率（%）
  thirdRate: number;      // 3位率（%）
  lastRate: number;       // ラス率（%）
  
  // 追加統計項目
  maxConsecutiveFirst: number;  // 連続トップ記録
  maxConsecutiveLast: number;   // 連続ラス記録
  maxScore: number;            // 最高得点
  minScore: number;            // 最低得点
}

export interface StatsResponse {
  success: boolean;
  data: StatsSummary;
}

import { GameMode } from './common';
import { Match } from './match';

export interface StatsFilters {
  from?: string;      // 開始日（YYYY-MM-DD）
  to?: string;        // 終了日（YYYY-MM-DD）
  mode: GameMode;     // ゲームモード
  venueId?: string;   // 会場ID
  rulesetId?: string; // ルールセットID
}

export interface ChartDataResponse {
  success: boolean;
  data: {
    matches: Match[];
  };
}