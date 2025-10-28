/**
 * 順位の色定義（共通）
 */
import { GameMode } from '../types/common';

// 統計値の良い/悪いを表す色
export const POSITIVE_COLOR = '#4CAF50'; // グリーン - 好調/プラス
export const NEGATIVE_COLOR = '#FF6B6B'; // レッド - 不調/マイナス

export const getRankColor = (rank: number, gameMode: GameMode): string => {
  if (gameMode === 'three') {
    // 3人麻雀の色設定
    const colors: Record<number, string> = {
      1: '#4CAF50', // グリーン - 好調
      2: '#FFB74D', // ライトオレンジ - やや注意
      3: '#F44336', // レッド - 危険
    };
    return colors[rank] || '#666666';
  } else {
    // 4人麻雀の色設定
    const colors: Record<number, string> = {
      1: '#4CAF50', // グリーン - 好調
      2: '#2196F3', // ブルー - 平均
      3: '#FF9800', // オレンジ - 注意
      4: '#F44336', // レッド - 危険
    };
    return colors[rank] || '#666666';
  }
};

export const getRankColors = (gameMode: GameMode): string[] => {
  if (gameMode === 'three') {
    return ['#4CAF50', '#FFB74D', '#F44336'];
  } else {
    return ['#4CAF50', '#2196F3', '#FF9800', '#F44336'];
  }
};

// グラフ用の色定義（円グラフで区別しやすい配色）
export const getRankColorsForChart = (gameMode: GameMode): string[] => {
  if (gameMode === 'three') {
    return [
      '#4CAF50', // グリーン - 1位
      '#FFC107', // アンバー - 2位（中間色として目立つ）
      '#E91E63', // ピンク - 3位（赤系だが区別しやすい）
    ];
  } else {
    return [
      '#4CAF50', // グリーン - 1位
      '#2196F3', // ブルー - 2位
      '#FF9800', // オレンジ - 3位
      '#F44336', // パープル - 4位（赤の代わりに紫で区別）
    ];
  }
};
