import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Match } from '../../types/match';
import { GameMode } from '../../types/common';
import { GameModeTab } from '../common/GameModeTab';
import { MatchService } from '../../services/matchService';

const HistoryScreen: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('four');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 対局履歴を取得する関数
  const fetchMatches = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await MatchService.getMatches({
        mode: selectedMode,
      });

      if (response.success && response.data) {
        setMatches(response.data);
      } else {
        throw new Error(response.message || '履歴データの取得に失敗しました');
      }
    } catch (error) {
      console.error('履歴データ取得エラー:', error);
      Alert.alert('エラー', '履歴データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedMode]);

  const onRefresh = () => {
    fetchMatches(true);
  };

  const onModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getRankText = (rank: number, gameMode: GameMode) => {
    if (gameMode === 'three') {
      const rankTexts = ['', '1位', '2位', '3位'];
      return rankTexts[rank] || `${rank}位`;
    } else {
      const rankTexts = ['', '1位', '2位', '3位', '4位'];
      return rankTexts[rank] || `${rank}位`;
    }
  };

  const getRankColor = (rank: number, gameMode: GameMode) => {
    if (rank === 1) return '#4CAF50'; // 1位は緑
    
    if (gameMode === 'three') {
      return rank === 3 ? '#F44336' : '#666666'; // 3人麻雀では3位がラス
    } else {
      return rank === 4 ? '#F44336' : '#666666'; // 4人麻雀では4位がラス
    }
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity style={styles.matchItem}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchDate}>{formatDate(item.date)}</Text>
        <View style={styles.matchRankContainer}>
          <Text style={styles.matchMode}>
            {item.gameMode === 'three' ? '3麻' : '4麻'}
          </Text>
          <Text style={[styles.matchRank, { color: getRankColor(item.rank, item.gameMode) }]}>
            {getRankText(item.rank, item.gameMode)}
          </Text>
        </View>
      </View>
      <View style={styles.matchDetails}>
        <Text style={styles.matchPoints}>
          {item.finalPoints !== undefined ? `${item.finalPoints}pt` : '-'}
        </Text>
        {item.chipCount !== undefined && item.chipCount > 0 && (
          <Text style={styles.matchChips}>チップ: {item.chipCount}枚</Text>
        )}
      </View>
      {item.memo && (
        <Text style={styles.matchMemo} numberOfLines={1}>
          {item.memo}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>履歴データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>対局履歴</Text>
        <GameModeTab selectedMode={selectedMode} onModeChange={onModeChange} />
      </View>

      {/* 対局履歴リスト */}
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.matchId}
        style={styles.matchList}
        contentContainerStyle={matches.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>履歴がありません</Text>
            <Text style={styles.emptySubtext}>対局を登録してください</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  matchList: {
    flex: 1,
    padding: 20,
  },
  matchItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 14,
    color: '#666666',
  },
  matchRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchMode: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchRank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchPoints: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  matchChips: {
    fontSize: 14,
    color: '#666666',
  },
  matchMemo: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
});

export default HistoryScreen;