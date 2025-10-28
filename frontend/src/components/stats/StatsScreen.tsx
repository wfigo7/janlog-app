/**
 * 統計画面（トップ画面）
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatsCard } from './StatsCard';
import { RankDistributionCard } from './RankDistributionCard';
import { FilterBar, FilterOptions } from '../common/FilterBar';
import { StatsChart } from './StatsChart';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { StatsService } from '../../services/statsService';
import { StatsSummary, ChartDataResponse } from '../../types/stats';
import { Match } from '../../types/match';
import { useGameMode } from '../../contexts/GameModeContext';
import { POSITIVE_COLOR, NEGATIVE_COLOR } from '../../constants/rankColors';

export default function StatsScreen() {
  const { showAlert, AlertComponent } = useCustomAlert();
  const { gameMode } = useGameMode();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [chartData, setChartData] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showCharts, setShowCharts] = useState(false);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const apiFilters = {
        mode: gameMode,
        from: filters.dateRange?.from,
        to: filters.dateRange?.to,
        venueId: filters.venueId,
        rulesetId: filters.rulesetId,
      };

      // 統計データとチャートデータを並行取得
      const [statsResponse, chartResponse] = await Promise.all([
        StatsService.getStatsSummary(apiFilters),
        StatsService.getChartData(apiFilters),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        throw new Error('統計データの取得に失敗しました');
      }

      if (chartResponse.success) {
        setChartData(chartResponse.data.matches || []);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      showAlert({
        title: 'エラー',
        message: 'データの取得に失敗しました',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // ゲームモード変更時にフィルターをリセット
    setFilters({});
    loadData();
  }, [gameMode]);

  useEffect(() => {
    loadData();
  }, [filters]);

  // 画面がフォーカスされた時にデータを再取得
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [gameMode, filters])
  );

  const onRefresh = () => {
    loadData(true);
  };

  const onFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const toggleCharts = () => {
    setShowCharts(!showCharts);
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

  // 平均順位の色を期待値基準で判定
  const expectedRank = gameMode === 'three' ? 2.0 : 2.5;
  const avgRankColor = stats.avgRank <= expectedRank ? POSITIVE_COLOR : NEGATIVE_COLOR;

  // 率統計の計算と色判定
  const rentalRate = stats.count > 0 ? (stats.rankDistribution.first + stats.rankDistribution.second) / stats.count * 100 : 0;
  const lastAvoidRate = 100 - stats.lastRate;
  const topRateThreshold = gameMode === 'three' ? 33.3 : 25;
  const lastAvoidRateThreshold = gameMode === 'three' ? 66.7 : 75;
  const lastRateThreshold = gameMode === 'three' ? 33.3 : 25;

  const rentalRateColor = rentalRate >= 50 ? POSITIVE_COLOR : NEGATIVE_COLOR;
  const lastAvoidRateColor = lastAvoidRate >= lastAvoidRateThreshold ? POSITIVE_COLOR : NEGATIVE_COLOR;
  const topRateColor = stats.topRate >= topRateThreshold ? POSITIVE_COLOR : NEGATIVE_COLOR;
  const lastRateColor = stats.lastRate < lastRateThreshold ? POSITIVE_COLOR : NEGATIVE_COLOR;

  return (
    <View style={styles.container}>
      {/* コントロール部分 */}
      <View style={styles.controlsContainer}>
        {/* フィルターと表示オプション */}
        <View style={styles.optionsContainer}>
          <FilterBar
            value={filters}
            onChange={onFiltersChange}
            gameMode={gameMode}
            showVenueFilter={true}
            showRulesetFilter={true}
          />

          <TouchableOpacity
            style={[styles.optionButton, showCharts && styles.optionButtonActive]}
            onPress={toggleCharts}
          >
            <Ionicons
              name="bar-chart-outline"
              size={16}
              color={showCharts ? "#FFFFFF" : "#666666"}
            />
            <Text style={[
              styles.optionButtonText,
              showCharts && styles.optionButtonTextActive
            ]}>
              グラフ表示
            </Text>
          </TouchableOpacity>
        </View>
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
                  value={`${stats.count}局`}
                />
                <StatsCard
                  title="トータルポイント"
                  value={stats.totalPoints > 0 ? `+${stats.totalPoints.toFixed(1)}` : stats.totalPoints.toFixed(1)}
                  color={stats.totalPoints >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                />
              </View>
              <View style={styles.statsRow}>
                <StatsCard
                  title="平均順位"
                  value={stats.avgRank.toFixed(2)}
                  color={avgRankColor}
                />
                <StatsCard
                  title="平均スコア"
                  value={stats.avgScore > 0 ? `+${stats.avgScore.toFixed(1)}` : stats.avgScore.toFixed(1)}
                  color={stats.avgScore >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                />
              </View>
            </View>
          </View>

          {/* 順位分布 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>順位分布</Text>
            <RankDistributionCard
              distribution={stats.rankDistribution}
              totalCount={stats.count}
              gameMode={gameMode}
            />
          </View>

          {/* チャート表示 */}
          {showCharts && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>グラフ分析</Text>

              {/* 順位分布チャート */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>順位分布</Text>
                <StatsChart
                  type="rank-distribution"
                  data={stats.rankDistribution}
                  gameMode={gameMode}
                />
              </View>
            </View>
          )}

          {/* 率統計 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>率統計</Text>
            <View style={styles.statsGrid}>
              {gameMode === 'four' && (
                <View style={styles.statsRow}>
                  <StatsCard
                    title="連帯率"
                    value={`${rentalRate.toFixed(1)}%`}
                    color={rentalRateColor}
                    subtitle="1位+2位"
                  />
                  <StatsCard
                    title="ラス回避率"
                    value={`${lastAvoidRate.toFixed(1)}%`}
                    color={lastAvoidRateColor}
                  />
                </View>
              )}
              {gameMode === 'three' && (
                <View style={styles.statsRow}>
                  <StatsCard
                    title="ラス回避率"
                    value={`${lastAvoidRate.toFixed(1)}%`}
                    color={lastAvoidRateColor}
                  />
                </View>
              )}
              <View style={styles.statsRow}>
                <StatsCard
                  title="トップ率"
                  value={`${stats.topRate.toFixed(1)}%`}
                  color={topRateColor}
                />
                <StatsCard
                  title="ラス率"
                  value={`${stats.lastRate.toFixed(1)}%`}
                  color={lastRateColor}
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
                />
                <StatsCard
                  title="連続ラス"
                  value={`${stats.maxConsecutiveLast}回`}
                />
              </View>
              <View style={styles.statsRow}>
                <StatsCard
                  title="最高スコア"
                  value={stats.maxScore > -Infinity ? `+${stats.maxScore.toFixed(1)}` : '---'}
                  color={stats.maxScore > -Infinity ? (stats.maxScore >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR) : undefined}
                />
                <StatsCard
                  title="最低スコア"
                  value={stats.minScore < Infinity ? stats.minScore.toFixed(1) : '---'}
                  color={stats.minScore < Infinity ? (stats.minScore >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR) : undefined}
                />
              </View>
            </View>
          </View>

          {/* その他 */}
          {stats.chipTotal !== undefined && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>その他</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  title="チップ合計"
                  value={`${stats.chipTotal}枚`}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <AlertComponent />
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
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
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
    padding: 12,
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
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
});