/**
 * テスト用ルールセットフィクスチャ
 * 
 * このファイルは、対局データバリデーションのテストで使用する
 * ルールセットのテストデータを提供します。
 */

import { Ruleset } from '../../../types/ruleset';

/**
 * 固定ウマルール（3人麻雀）
 * - 35000点持ち40000点返し
 * - ウマ: [20, 0, -20]
 * - オカ: 15
 */
export const FIXED_UMA_THREE: Ruleset = {
  rulesetId: 'test-fixed-three',
  ruleName: '3人麻雀標準（固定ウマ）',
  gameMode: 'three',
  startingPoints: 35000,
  basePoints: 40000,
  useFloatingUma: false,
  uma: [20, 0, -20],
  oka: 15,
  useChips: false,
  isGlobal: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * 固定ウマルール（4人麻雀）
 * - 25000点持ち30000点返し
 * - ウマ: [30, 10, -10, -30]
 * - オカ: 20
 */
export const FIXED_UMA_FOUR: Ruleset = {
  rulesetId: 'test-fixed-four',
  ruleName: 'Mリーグルール（固定ウマ）',
  gameMode: 'four',
  startingPoints: 25000,
  basePoints: 30000,
  useFloatingUma: false,
  uma: [30, 10, -10, -30],
  oka: 20,
  useChips: false,
  isGlobal: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * 浮きウマルール（3人麻雀）
 * - 30000点持ち35000点返し
 * - 浮き人数別ウマ:
 *   - 0人: [0, 0, 0] (全員沈み)
 *   - 1人: [40, -20, -20]
 *   - 2人: [20, 0, -20]
 *   - 3人: [0, 0, 0] (全員浮き)
 * - オカ: 15
 */
export const FLOATING_UMA_THREE: Ruleset = {
  rulesetId: 'test-floating-three',
  ruleName: '3人麻雀浮きウマルール',
  gameMode: 'three',
  startingPoints: 30000,
  basePoints: 35000,
  useFloatingUma: true,
  uma: [20, 0, -20], // 標準ウマ（使用されない）
  umaMatrix: {
    '0': [0, 0, 0],
    '1': [40, -20, -20],
    '2': [20, 0, -20],
    '3': [0, 0, 0],
  },
  oka: 15,
  useChips: false,
  isGlobal: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * 浮きウマルール（4人麻雀）
 * - 30000点持ち30000点返し（開始点=基準点）
 * - 浮き人数別ウマ:
 *   - 0人: [0, 0, 0, 0] (存在しない)
 *   - 1人: [12, -1, -3, -8]
 *   - 2人: [8, 4, -4, -8]
 *   - 3人: [8, 3, 1, -12]
 *   - 4人: [0, 0, 0, 0] (全員浮き)
 * - オカ: 0
 */
export const FLOATING_UMA_FOUR: Ruleset = {
  rulesetId: 'test-floating-four',
  ruleName: '日本プロ麻雀連盟公式ルール',
  gameMode: 'four',
  startingPoints: 30000,
  basePoints: 30000,
  useFloatingUma: true,
  uma: [30, 10, -10, -30], // 標準ウマ（使用されない）
  umaMatrix: {
    '0': [0, 0, 0, 0],
    '1': [12, -1, -3, -8],
    '2': [8, 4, -4, -8],
    '3': [8, 3, 1, -12],
    '4': [0, 0, 0, 0],
  },
  oka: 0,
  useChips: false,
  isGlobal: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * 固定ウマルール（4人麻雀、開始点=基準点）
 * - 25000点持ち25000点返し
 * - ウマ: [30, 10, -10, -30]
 * - オカ: 0
 * 
 * 注意: 開始点=基準点の場合、全員原点は「全員浮き」として扱われる
 */
export const FIXED_UMA_FOUR_EQUAL_POINTS: Ruleset = {
  rulesetId: 'test-fixed-four-equal',
  ruleName: '固定ウマ（開始点=基準点）',
  gameMode: 'four',
  startingPoints: 25000,
  basePoints: 25000,
  useFloatingUma: false,
  uma: [30, 10, -10, -30],
  oka: 0,
  useChips: false,
  isGlobal: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * 全てのテスト用ルールセット
 */
export const ALL_TEST_RULESETS: Ruleset[] = [
  FIXED_UMA_THREE,
  FIXED_UMA_FOUR,
  FLOATING_UMA_THREE,
  FLOATING_UMA_FOUR,
  FIXED_UMA_FOUR_EQUAL_POINTS,
];

/**
 * ゲームモード別のテスト用ルールセット
 */
export const TEST_RULESETS_BY_MODE = {
  three: [FIXED_UMA_THREE, FLOATING_UMA_THREE],
  four: [FIXED_UMA_FOUR, FLOATING_UMA_FOUR, FIXED_UMA_FOUR_EQUAL_POINTS],
};

/**
 * ウマタイプ別のテスト用ルールセット
 */
export const TEST_RULESETS_BY_UMA_TYPE = {
  fixed: [FIXED_UMA_THREE, FIXED_UMA_FOUR, FIXED_UMA_FOUR_EQUAL_POINTS],
  floating: [FLOATING_UMA_THREE, FLOATING_UMA_FOUR],
};
