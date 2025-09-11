/**
 * 順位分布カードコンポーネント
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RankDistribution, GameMode } from '../../types/stats';

interface RankDistributionCardProps {
  distribution: RankDistribution;
  totalCount: number;
  gameMode: GameMode;
}

export const RankDistributionCard: React.FC<RankDistributionCardProps> = ({ 
  distribution, 
  totalCount,
  gameMode 
}) => {
  const getRankColor = (rank: number) => {
    const colors = {
      1: '#FFD700', // ゴールド
      2: '#C0C0C0', // シルバー
      3: '#CD7F32', // ブロンズ
      4: '#8B4513', // ブラウン
    };
    return colors[rank as keyof typeof colors] || '#666666';
  };

  const getRankLabel = (rank: number) => {
    const labels = {
      1: '1位',
      2: '2位', 
      3: '3位',
      4: '4位',
    };
    return labels[rank as keyof typeof labels];
  };

  const getPercentage = (count: number) => {
    return totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
  };

  const ranks = gameMode === 'three' ? [1, 2, 3] : [1, 2, 3, 4];
  const distributionArray = [
    distribution.first,
    distribution.second,
    distribution.third,
    distribution.fourth,
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>順位分布</Text>
      <View style={styles.distributionContainer}>
        {ranks.map((rank) => {
          const count = distributionArray[rank - 1];
          const percentage = getPercentage(count);
          
          return (
            <View key={rank} style={styles.rankItem}>
              <View style={styles.rankHeader}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
                  <Text style={styles.rankBadgeText}>{getRankLabel(rank)}</Text>
                </View>
              </View>
              <Text style={styles.rankCount}>{count}回</Text>
              <Text style={styles.rankPercentage}>{percentage}%</Text>
            </View>
          );
        })}
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
  distributionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rankHeader: {
    marginBottom: 8,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  rankPercentage: {
    fontSize: 12,
    color: '#666666',
  },
});