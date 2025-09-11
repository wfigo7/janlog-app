import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatsSummary } from '../../types/stats';
import { GameMode } from '../../types/match';

const StatsScreen: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('four');
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // 統計データを取得する関数（現在はモックデータ）
  const fetchStats = async (gameMode: GameMode) => {
    setLoading(true);
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // 現在はモックデータを返す
      const mockStats: StatsSummary = {
        count: 0,
        avgRank: 0,
        topRate: 0,
        lastRate: 0,
        totalPoints: 0,
        chipTotal: 0,
      };
      setStats(mockStats);
    } catch (error) {
      Alert.alert('エラー', '統計データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedMode);
  }, [selectedMode]);

  const renderStatsCard = (title: string, value: string | number, unit?: string) => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsValue}>
        {value}{unit && <Text style={styles.statsUnit}>{unit}</Text>}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* ゲームモード選択タブ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedMode === 'four' && styles.activeTab]}
          onPress={() => setSelectedMode('four')}
        >
          <Text style={[styles.tabText, selectedMode === 'four' && styles.activeTabText]}>
            4人麻雀
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedMode === 'three' && styles.activeTab]}
          onPress={() => setSelectedMode('three')}
        >
          <Text style={[styles.tabText, selectedMode === 'three' && styles.activeTabText]}>
            3人麻雀
          </Text>
        </TouchableOpacity>
      </View>

      {/* 統計カード */}
      <View style={styles.statsContainer}>
        {stats ? (
          <>
            {renderStatsCard('対局数', stats.count, '回')}
            {renderStatsCard('平均順位', stats.avgRank.toFixed(2), '位')}
            {renderStatsCard('トップ率', (stats.topRate * 100).toFixed(1), '%')}
            {renderStatsCard('ラス率', (stats.lastRate * 100).toFixed(1), '%')}
            {renderStatsCard('累積ポイント', stats.totalPoints.toFixed(0), 'pt')}
            {renderStatsCard('チップ合計', stats.chipTotal, '枚')}
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {loading ? '読み込み中...' : 'データがありません'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  statsContainer: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    color: '#333',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statsUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
});

export default StatsScreen;