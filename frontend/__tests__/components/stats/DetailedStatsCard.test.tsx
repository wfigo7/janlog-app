/**
 * DetailedStatsCard コンポーネントのテスト
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { DetailedStatsCard } from '../../../src/components/stats/DetailedStatsCard';
import { StatsSummary } from '../../../src/types/stats';

const mockStats: StatsSummary = {
  count: 10,
  avgRank: 2.3,
  avgScore: 5.2,
  totalPoints: 52.0,
  chipTotal: 15,
  rankDistribution: {
    first: 3,
    second: 2,
    third: 3,
    fourth: 2,
  },
  topRate: 30.0,
  secondRate: 20.0,
  thirdRate: 30.0,
  lastRate: 20.0,
  maxConsecutiveFirst: 2,
  maxConsecutiveLast: 1,
  maxScore: 45.5,
  minScore: -25.3,
};

describe('DetailedStatsCard', () => {
  it('4人麻雀の詳細統計を正しく表示する', () => {
    const { getByText } = render(
      <DetailedStatsCard stats={mockStats} gameMode="four" />
    );

    expect(getByText('詳細分析')).toBeTruthy();
    expect(getByText('上位率')).toBeTruthy();
    expect(getByText('勝率')).toBeTruthy();
    expect(getByText('安定度')).toBeTruthy();
    expect(getByText('期待値差')).toBeTruthy();
  });

  it('3人麻雀の詳細統計を正しく表示する', () => {
    const { getByText } = render(
      <DetailedStatsCard stats={mockStats} gameMode="three" />
    );

    expect(getByText('詳細分析')).toBeTruthy();
    expect(getByText('上位率')).toBeTruthy();
    expect(getByText('勝率')).toBeTruthy();
  });

  it('データが空の場合でもエラーにならない', () => {
    const emptyStats: StatsSummary = {
      count: 0,
      avgRank: 0,
      avgScore: 0,
      totalPoints: 0,
      chipTotal: 0,
      rankDistribution: {
        first: 0,
        second: 0,
        third: 0,
        fourth: 0,
      },
      topRate: 0,
      secondRate: 0,
      thirdRate: 0,
      lastRate: 0,
      maxConsecutiveFirst: 0,
      maxConsecutiveLast: 0,
      maxScore: -Infinity,
      minScore: Infinity,
    };

    const { getByText } = render(
      <DetailedStatsCard stats={emptyStats} gameMode="four" />
    );

    expect(getByText('詳細分析')).toBeTruthy();
  });
});