import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Match } from '../../types/match';
import { GameMode } from '../../types/common';
import { MatchService } from '../../services/matchService';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const MatchDetailScreen: React.FC = () => {
  const { matchId } = useLocalSearchParams();
  const matchIdString = Array.isArray(matchId) ? matchId[0] : matchId as string;
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();



  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchIdString) {
      fetchMatchDetail();
    }
  }, [matchIdString]);

  // 画面がフォーカスされた時にデータを再取得（編集後の更新を反映）
  useFocusEffect(
    useCallback(() => {
      if (matchIdString) {
        fetchMatchDetail();
      }
    }, [matchIdString])
  );

  const fetchMatchDetail = async () => {
    if (!matchIdString) return;

    try {
      setLoading(true);
      const response = await MatchService.getMatchById(matchIdString);

      if (response.success && response.data) {
        setMatch(response.data);
      } else {
        throw new Error(response.message || '対局詳細の取得に失敗しました');
      }
    } catch (error) {
      console.error('対局詳細取得エラー:', error);
      showAlert({
        title: 'エラー',
        message: '対局詳細の取得に失敗しました',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: () => router.back(),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/match/edit/${matchIdString}`);
  };

  const handleDelete = () => {
    showAlert({
      title: '対局を削除',
      message: 'この対局を削除しますか？この操作は取り消せません。',
      buttons: [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            confirmDelete();
          },
        },
      ],
    });
  };

  const confirmDelete = async () => {
    if (!matchIdString) {
      console.log('matchIdString is null or undefined');
      return;
    }

    try {
      const response = await MatchService.deleteMatch(matchIdString);

      if (response.success) {
        showAlert({
          title: '削除完了',
          message: '対局を削除しました',
          buttons: [
            {
              text: 'OK',
              style: 'default',
              onPress: () => {
                router.back();
              },
            },
          ],
        });
      } else {
        throw new Error(response.message || '削除に失敗しました');
      }
    } catch (error) {
      console.error('対局削除エラー:', error);
      showAlert({
        title: 'エラー',
        message: '対局の削除に失敗しました',
        buttons: [
          {
            text: 'OK',
            style: 'default',
          },
        ],
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
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

  const getEntryMethodText = (entryMethod: string) => {
    switch (entryMethod) {
      case 'rank_plus_points':
        return '順位+最終スコア';
      case 'rank_plus_raw':
        return '順位+素点';
      case 'provisional_rank_only':
        return '順位のみ（仮スコア）';
      default:
        return entryMethod;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>対局詳細を読み込み中...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>対局データが見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 基本情報 */}
      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.sectionTitle}>基本情報</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>日時</Text>
            <Text style={styles.infoValue}>{formatDate(match.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ゲームモード</Text>
            <Text style={styles.infoValue}>
              {match.gameMode === 'three' ? '3人麻雀' : '4人麻雀'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>入力方式</Text>
            <Text style={styles.infoValue}>{getEntryMethodText(match.entryMethod)}</Text>
          </View>
          {match.venueName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>会場</Text>
              <Text style={styles.infoValue}>{match.venueName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 成績情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>成績</Text>
        <View style={styles.resultCard}>
          <View style={styles.rankContainer}>
            <Text style={styles.rankLabel}>順位</Text>
            <Text style={[styles.rankValue, { color: getRankColor(match.rank, match.gameMode) }]}>
              {getRankText(match.rank, match.gameMode)}
            </Text>
          </View>

          {match.finalPoints !== undefined && match.finalPoints !== null && (
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>最終ポイント</Text>
              <Text style={[
                styles.pointsValue,
                { color: match.finalPoints >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {match.finalPoints >= 0 ? '+' : ''}{match.finalPoints}pt
              </Text>
            </View>
          )}

          {match.rawScore !== undefined && match.rawScore !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>素点</Text>
              <Text style={styles.infoValue}>{match.rawScore.toLocaleString()}点</Text>
            </View>
          )}

          {match.chipCount !== undefined && match.chipCount !== null && match.chipCount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>チップ</Text>
              <Text style={styles.infoValue}>{match.chipCount}枚</Text>
            </View>
          )}
        </View>
      </View>

      {/* 追加情報 */}
      {match.memo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>追加情報</Text>
          <View style={styles.infoCard}>
            <View style={styles.memoContainer}>
              <Text style={styles.infoLabel}>メモ</Text>
              <Text style={styles.memoText}>{match.memo}</Text>
            </View>
          </View>
        </View>
      )}

      {/* アクションボタン */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
      <AlertComponent />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  firstSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  rankContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rankLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  rankValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  memoContainer: {
    paddingVertical: 8,
  },
  memoText: {
    fontSize: 14,
    color: '#333333',
    marginTop: 8,
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  disabledButtonText: {
    color: '#999999',
  },
});

export default MatchDetailScreen;