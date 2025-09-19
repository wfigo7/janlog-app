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
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatsCard } from './StatsCard';
import { GameModeTab } from '../common/GameModeTab';
import { RankDistributionCard } from './RankDistributionCard';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { StatsChart } from './StatsChart';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { DetailedStatsCard } from './DetailedStatsCard';
import { StatsService } from '../../services/statsService';
import { StatsSummary, ChartDataResponse } from '../../types/stats';
import { GameMode } from '../../types/common';
import { Match } from '../../types/match';

export default function StatsScreen() {
  const { showAlert, AlertComponent } = useCustomAlert();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [chartData, setChartData] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('four');
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [showCharts, setShowCharts] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        mode: selectedMode,
        from: dateRange.from,
        to: dateRange.to,
      };

      // 統計データとチャートデータを並行取得
      const [statsResponse, chartResponse] = await Promise.all([
        StatsService.getStatsSummary(filters),
        StatsService.getChartData(filters),
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
    loadData();
  }, [selectedMode, dateRange]);

  const onRefresh = () => {
    loadData(true);
  };

  const onModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const onDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const toggleCharts = () => {
    setShowCharts(!showCharts);
  };

  const toggleDetailedStats = () => {
    setShowDetailedStats(!showDetailedStats);
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

        {/* 期間フィルター */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>期間フィルター</Text>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="全期間"
          />
        </View>

        {/* 表示オプション */}
        <View style={styles.optionsContainer}>
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

          <TouchableOpacity
            style={[styles.optionButton, showDetailedStats && styles.optionButtonActive]}
            onPress={toggleDetailedStats}
          >
            <Ionicons
              name="analytics-outline"
              size={16}
              color={showDetailedStats ? "#FFFFFF" : "#666666"}
            />
            <Text style={[
              styles.optionButtonText,
              showDetailedStats && styles.optionButtonTextActive
            ]}>
              詳細分析
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
                  gameMode={selectedMode}
                />
              </View>

              {/* 順位推移チャート */}
              {chartData.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>最近の順位推移</Text>
                  <StatsChart
                    type="trend"
                    data={chartData}
                    gameMode={selectedMode}
                  />
                </View>
              )}

              {/* ポイント推移チャート */}
              {chartData.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>最近のポイント推移</Text>
                  <StatsChart
                    type="performance"
                    data={chartData}
                    gameMode={selectedMode}
                  />
                </View>
              )}
            </View>
          )}

          {/* 詳細統計 */}
          {showDetailedStats && (
            <View style={styles.section}>
              <DetailedStatsCard stats={stats} gameMode={selectedMode} />
            </View>
          )}

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
              <View style={styles.statsRow}>
                <StatsCard
                  title="2位率"
                  value={`${stats.secondRate.toFixed(1)}%`}
                  color="#C0C0C0"
                />
                <StatsCard
                  title="3位率"
                  value={`${stats.thirdRate.toFixed(1)}%`}
                  color="#CD7F32"
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
  filterContainer: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
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