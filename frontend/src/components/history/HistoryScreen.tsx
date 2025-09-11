import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Match, GameMode } from '../../types/match';

const HistoryScreen: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('four');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  // 対局履歴を取得する関数（現在はモックデータ）
  const fetchMatches = async (gameMode: GameMode) => {
    setLoading(true);
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // 現在は空の配列を返す
      const mockMatches: Match[] = [];
      setMatches(mockMatches);
    } catch (error) {
      Alert.alert('エラー', '履歴データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(selectedMode);
  }, [selectedMode]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getRankText = (rank: number) => {
    const rankTexts = ['', '1位', '2位', '3位', '4位'];
    return rankTexts[rank] || `${rank}位`;
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity style={styles.matchItem}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchDate}>{formatDate(item.date)}</Text>
        <Text style={[styles.matchRank, { color: item.rank === 1 ? '#4CAF50' : item.rank === 4 ? '#F44336' : '#666' }]}>
          {getRankText(item.rank)}
        </Text>
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

  return (
    <View style={styles.container}>
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

      {/* 対局履歴リスト */}
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.matchId}
        style={styles.matchList}
        contentContainerStyle={matches.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '読み込み中...' : '履歴がありません'}
            </Text>
          </View>
        }
      />
    </View>
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
  matchList: {
    flex: 1,
    padding: 16,
  },
  matchItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
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
    color: '#333',
  },
  matchChips: {
    fontSize: 14,
    color: '#666',
  },
  matchMemo: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HistoryScreen;