import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Match } from '../../types/match';
import { GameMode } from '../../types/common';
import { GameModeTab } from '../common/GameModeTab';
import { MatchService, PaginationInfo } from '../../services/matchService';

type SortOrder = 'newest' | 'oldest';

const HistoryScreen: React.FC = () => {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<GameMode>('four');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // 対局履歴を取得する関数
  const fetchMatches = async (showRefresh = false, loadMore = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await MatchService.getMatches({
        mode: selectedMode,
        limit: 20,
        nextKey: loadMore ? pagination?.nextKey : undefined,
      });

      if (response.success && response.data) {
        const newMatches = loadMore ? [...matches, ...response.data] : response.data;
        const sortedMatches = sortMatches(newMatches, sortOrder);
        setMatches(sortedMatches);
        setPagination(response.pagination || null);
      } else {
        throw new Error(response.message || '履歴データの取得に失敗しました');
      }
    } catch (error) {
      console.error('履歴データ取得エラー:', error);
      Alert.alert('エラー', '履歴データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedMode]);

  // 画面がフォーカスされた時にデータを再取得
  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [selectedMode])
  );

  useEffect(() => {
    if (matches.length > 0) {
      const sortedMatches = sortMatches([...matches], sortOrder);
      setMatches(sortedMatches);
    }
  }, [sortOrder]);

  const sortMatches = (matchList: Match[], order: SortOrder): Match[] => {
    return matchList.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const onRefresh = () => {
    setPagination(null);
    fetchMatches(true);
  };

  const loadMoreMatches = () => {
    if (pagination?.hasMore && !loadingMore) {
      fetchMatches(false, true);
    }
  };

  const onModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    setPagination(null); // ページネーション情報をリセット
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
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

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => handleMatchPress(item.matchId)}
    >
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
      {item.venueName && (
        <Text style={styles.matchVenue} numberOfLines={1}>
          会場: {item.venueName}
        </Text>
      )}
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
      {/* コントロール部分 */}
      <View style={styles.controlsContainer}>
        <GameModeTab selectedMode={selectedMode} onModeChange={onModeChange} />

        {/* ソート機能 */}
        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton} onPress={toggleSortOrder}>
            <Text style={styles.sortButtonText}>
              {sortOrder === 'newest' ? '新しい順 ↓' : '古い順 ↑'}
            </Text>
          </TouchableOpacity>
        </View>
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
        onEndReached={loadMoreMatches}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadMoreText}>読み込み中...</Text>
            </View>
          ) : pagination?.hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreMatches}>
              <Text style={styles.loadMoreButtonText}>さらに読み込む</Text>
            </TouchableOpacity>
          ) : matches.length > 0 ? (
            <View style={styles.endContainer}>
              <Text style={styles.endText}>すべての履歴を表示しました</Text>
            </View>
          ) : null
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

  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sortContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
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
  matchVenue: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
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
  sortButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  endContainer: {
    padding: 20,
    alignItems: 'center',
  },
  endText: {
    fontSize: 12,
    color: '#999999',
  },
});

export default HistoryScreen;