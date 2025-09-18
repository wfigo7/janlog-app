/**
 * 統計画面（トップ画面）
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatsCard } from './StatsCard';
import { GameModeTab } from '../common/GameModeTab';
import { RankDistributionCard } from './RankDistributionCard';
import { StatsService } from '../../services/statsService';
import { StatsSummary } from '../../types/stats';
import { GameMode } from '../../types/common';

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('four');

  const loadStats = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await StatsService.getStatsSummary({
        mode: selectedMode,
      });

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error('統計データの取得に失敗しました');
      }
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      Alert.alert('エラー', '統計データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedMode]);

  const onRefresh = () => {
    loadStats(true);
  };

  const onModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>統計データを読み込み中...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>統計データがありません</Text>
        <Text style={styles.emptySubtext}>対局を登録してください</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* コントロール部分 */}
      <View style={styles.controlsContainer}>
        <GameModeTab selectedMode={selectedMode} onModeChange={onModeChange} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* 基本統計 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatsCard
                  title="対局数"
                  value={stats.count}
                  subtitle="半荘"
                />
                <StatsCard
                  title="平均順位"
                  value={stats.avgRank.toFixed(2)}
                  color="#FF6B6B"
                />
              </View>
              <View style={styles.statsRow}>
                <StatsCard
                  title="累積ポイント"
                  value={stats.totalPoints > 0 ? `+${stats.totalPoints.toFixed(1)}` : stats.totalPoints.toFixed(1)}
                  color={stats.totalPoints >= 0 ? "#4ECDC4" : "#FF6B6B"}
                />
                <StatsCard
                  title="平均スコア"
                  value={stats.avgScore > 0 ? `+${stats.avgScore.toFixed(1)}` : stats.avgScore.toFixed(1)}
                  color={stats.avgScore >= 0 ? "#4ECDC4" : "#FF6B6B"}
                />
              </View>
            </View>
          </View>

          {/* 順位分布 */}
          <View style={styles.section}>
            <RankDistributionCard
              distribution={stats.rankDistribution}
              totalCount={stats.count}
              gameMode={selectedMode}
            />
          </View>

          {/* 率統計 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>率統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatsCard
                  title="トップ率"
                  value={`${stats.topRate.toFixed(1)}%`}
                  color="#FFD700"
                />
                <StatsCard
                  title="ラス率"
                  value={`${stats.lastRate.toFixed(1)}%`}
                  color="#FF6B6B"
                />
              </View>
            </View>
          </View>

          {/* 記録 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>記録</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatsCard
                  title="連続トップ"
                  value={`${stats.maxConsecutiveFirst}回`}
                  color="#FFD700"
                />
                <StatsCard
                  title="連続ラス"
                  value={`${stats.maxConsecutiveLast}回`}
                  color="#FF6B6B"
                />
              </View>
              <View style={styles.statsRow}>
                <StatsCard
                  title="最高得点"
                  value={stats.maxScore > -Infinity ? `+${stats.maxScore.toFixed(1)}` : '---'}
                  color="#4ECDC4"
                />
                <StatsCard
                  title="最低得点"
                  value={stats.minScore < Infinity ? stats.minScore.toFixed(1) : '---'}
                  color="#FF6B6B"
                />
              </View>
            </View>
          </View>

          {/* その他 */}
          {stats.chipTotal > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>その他</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  title="チップ合計"
                  value={stats.chipTotal}
                  color="#9B59B6"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
  },

  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});