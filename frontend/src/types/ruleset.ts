/**
 * ルールセット関連の型定義
 */

/**
 * 浮き人数別ウマ表の型定義
 * キー: 浮き人数（"0"〜"4"）
 * 値: ウマ配列（3人麻雀: 3要素、4人麻雀: 4要素）
 */
export type FloatingUmaMatrix = Record<string, number[]>;

export interface Ruleset {
  rulesetId: string;
  ruleName: string;
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
  useFloatingUma: boolean;
  uma: number[];
  umaMatrix?: FloatingUmaMatrix;
  oka: number;
  useChips: boolean;
  memo?: string;
  basicRules?: Record<string, any>;
  gameplayRules?: Record<string, any>;
  additionalRules?: AdditionalRule[];
  isGlobal: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalRule {
  name: string;
  value: string;
  enabled: boolean;
}

export interface RulesetListResponse {
  success: boolean;
  data: Ruleset[];
}

export interface PointCalculationRequest {
  rulesetId: string;
  rank: number;
  rawScore: number;
  floatingCount?: number;
}

export interface PointCalculationResponse {
  finalPoints: number;
  calculation: {
    rawScore: number;
    basePoints: number;
    baseCalculation: number;
    rank: number;
    umaPoints: number;
    okaPoints: number;
    finalPoints: number;
    formula: string;
  };
}

export interface RuleTemplate {
  name: string;
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
  uma: number[];
  oka: number;
  description: string;
}

export interface RuleTemplateResponse {
  templates: RuleTemplate[];
}