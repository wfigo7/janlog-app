import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MatchInput } from '../../types/match';
import { GameMode } from '../../types/common';

const MatchRegistrationScreen: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('four');
  const [rank, setRank] = useState<string>('');
  const [finalPoints, setFinalPoints] = useState<string>('');
  const [chipCount, setChipCount] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const maxRank = gameMode === 'four' ? 4 : 3;

  const handleSubmit = async () => {
    // バリデーション
    if (!rank || parseInt(rank) < 1 || parseInt(rank) > maxRank) {
      Alert.alert('エラー', `順位は1〜${maxRank}位で入力してください`);
      return;
    }

    if (!finalPoints || isNaN(parseFloat(finalPoints))) {
      Alert.alert('エラー', '最終スコアを正しく入力してください');
      return;
    }

    setLoading(true);
    try {
      const matchData: MatchInput = {
        gameMode,
        entryMethod: 'rank_plus_points',
        rulesetId: 'default', // TODO: ルール選択機能実装時に変更
        rank: parseInt(rank),
        finalPoints: parseFloat(finalPoints),
        chipCount: chipCount ? parseInt(chipCount) : undefined,
        memo: memo || undefined,
      };

      // TODO: 実際のAPI呼び出しに置き換える
      console.log('対局データ:', matchData);
      
      Alert.alert('成功', '対局を登録しました', [
        {
          text: 'OK',
          onPress: () => {
            // フォームをリセット
            setRank('');
            setFinalPoints('');
            setChipCount('');
            setMemo('');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('エラー', '対局の登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* ゲームモード選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ゲームモード</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, gameMode === 'four' && styles.activeTab]}
              onPress={() => setGameMode('four')}
            >
              <Text style={[styles.tabText, gameMode === 'four' && styles.activeTabText]}>
                4人麻雀
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, gameMode === 'three' && styles.activeTab]}
              onPress={() => setGameMode('three')}
            >
              <Text style={[styles.tabText, gameMode === 'three' && styles.activeTabText]}>
                3人麻雀
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 順位入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>順位</Text>
          <TextInput
            style={styles.input}
            value={rank}
            onChangeText={setRank}
            placeholder={`1〜${maxRank}位`}
            keyboardType="numeric"
            maxLength={1}
          />
        </View>

        {/* 最終スコア入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最終スコア</Text>
          <TextInput
            style={styles.input}
            value={finalPoints}
            onChangeText={setFinalPoints}
            placeholder="例: 25000, -15000"
            keyboardType="numeric"
          />
        </View>

        {/* チップ数入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>チップ数（任意）</Text>
          <TextInput
            style={styles.input}
            value={chipCount}
            onChangeText={setChipCount}
            placeholder="例: 5"
            keyboardType="numeric"
          />
        </View>

        {/* メモ入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メモ（任意）</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="対局の詳細やメモ"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 登録ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? '登録中...' : '対局を登録'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchRegistrationScreen;