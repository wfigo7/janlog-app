/**
 * 詳細統計カードコンポーネント
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatsSummary } from '../../types/stats';
import { GameMode } from '../../types/common';

interface DetailedStatsCardProps {
  stats: StatsSummary;
  gameMode: GameMode;
}

export const DetailedStatsCard: React.FC<DetailedStatsCardProps> = ({ 
  stats, 
  gameMode 
}) => {
  // 安定度指標（順位の標準偏差）
  const calculateStability = () => {
    if (stats.count === 0) return 0;
    
    // 各順位の出現回数から標準偏差を計算
    const ranks = [1, 2, 3, 4];
    const counts = [
      stats.rankDistribution.first,
      stats.rankDistribution.second,
      stats.rankDistribution.third,
      stats.rankDistribution.fourth,
    ];
    
    let totalWeightedRank = 0;
    let totalCount = 0;
    
    ranks.forEach((rank, index) => {
      const count = counts[index];
      totalWeightedRank += rank * count;
      totalCount += count;
    });
    
    const avgRank = totalWeightedRank / totalCount;
    
    let variance = 0;
    ranks.forEach((rank, index) => {
      const count = counts[index];
      variance += count * Math.pow(rank - avgRank, 2);
    });
    
    const standardDeviation = Math.sqrt(variance / totalCount);
    
    // 安定度スコア（標準偏差が小さいほど高い）
    const maxStdDev = gameMode === 'three' ? 1.0 : 1.5;
    const stabilityScore = Math.max(0, (maxStdDev - standardDeviation) / maxStdDev * 100);
    
    return stabilityScore;
  };

  // 期待値との差
  const calculateExpectedDifference = () => {
    const expectedRank = gameMode === 'three' ? 2.0 : 2.5;
    const difference = expectedRank - stats.avgRank;
    return difference;
  };

  // 上位率（1位+2位の合計）
  const getTopTwoRate = () => {
    if (stats.count === 0) return 0;
    return ((stats.rankDistribution.first + stats.rankDistribution.second) / stats.count * 100);
  };

  // 下位率（3位+4位の合計、3人麻雀では3位のみ）
  const getBottomRate = () => {
    if (stats.count === 0) return 0;
    if (gameMode === 'three') {
      return stats.thirdRate;
    } else {
      return ((stats.rankDistribution.third + stats.rankDistribution.fourth) / stats.count * 100);
    }
  };

  // 勝率（期待値以上の順位の割合）
  const getWinRate = () => {
    if (stats.count === 0) return 0;
    if (gameMode === 'three') {
      // 3人麻雀では1位+2位が期待値以上
      return getTopTwoRate();
    } else {
      // 4人麻雀では1位+2位が期待値以上
      return getTopTwoRate();
    }
  };

  const stability = calculateStability();
  const expectedDiff = calculateExpectedDifference();
  const topTwoRate = getTopTwoRate();
  const bottomRate = getBottomRate();
  const winRate = getWinRate();

  const detailStats = [
    {
      label: '上位率',
      value: `${topTwoRate.toFixed(1)}%`,
      description: '1位+2位の割合',
      color: topTwoRate >= 50 ? '#4ECDC4' : '#FF6B6B',
    },
    {
      label: '勝率',
      value: `${winRate.toFixed(1)}%`,
      description: '期待値以上の順位',
      color: winRate >= 50 ? '#4ECDC4' : '#FF6B6B',
    },
    {
      label: '安定度',
      value: `${stability.toFixed(1)}`,
      description: '順位のばらつき（100が最高）',
      color: stability >= 70 ? '#4ECDC4' : stability >= 40 ? '#FFD700' : '#FF6B6B',
    },
    {
      label: '期待値差',
      value: expectedDiff >= 0 ? `+${expectedDiff.toFixed(2)}` : expectedDiff.toFixed(2),
      description: '理論平均との差',
      color: expectedDiff >= 0 ? '#4ECDC4' : '#FF6B6B',
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>詳細分析</Text>
      <View style={styles.statsContainer}>
        {detailStats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
            </View>
            <Text style={styles.statDescription}>{stat.description}</Text>
          </View>
        ))}
      </View>
      
      {/* 追加の洞察 */}
      <View style={styles.insightContainer}>
        <Text style={styles.insightTitle}>分析結果</Text>
        {stats.avgRank < (gameMode === 'three' ? 2.0 : 2.5) && (
          <Text style={styles.insightText}>
            • 平均順位が期待値を上回っています（優秀）
          </Text>
        )}
        {stability >= 70 && (
          <Text style={styles.insightText}>
            • 順位が安定しており、実力が安定しています
          </Text>
        )}
        {stats.topRate >= 30 && (
          <Text style={styles.insightText}>
            • トップ率が高く、勝負強さがあります
          </Text>
        )}
        {stats.lastRate <= 20 && (
          <Text style={styles.insightText}>
            • ラス率が低く、大きな失敗が少ないです
          </Text>
        )}
        {stats.maxConsecutiveFirst >= 3 && (
          <Text style={styles.insightText}>
            • 連続トップ記録があり、好調期の波があります
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statItem: {
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statDescription: {
    fontSize: 12,
    color: '#666666',
  },
  insightContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 16,
  },
});