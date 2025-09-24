import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { EntryMethod } from '../../types/match';
import { GameMode } from '../../types/common';
import { Ruleset } from '../../types/ruleset';
import { GameModeTab } from '../common/GameModeTab';
import RuleSelector from './RuleSelector';
import EntryMethodSelector from './EntryMethodSelector';
import { MatchDatePicker } from './MatchDatePicker';

export interface MatchFormData {
  gameMode: GameMode;
  selectedRuleset: Ruleset | null;
  entryMethod: EntryMethod;
  matchDate: string;
  rank: string;
  finalPoints: string;
  rawScore: string;
  chipCount: string;
  memo: string;
}

export interface MatchFormErrors {
  rankError: string | null;
  finalPointsError: string | null;
  rawScoreError: string | null;
  dateError: string | null;
}

export interface MatchFormProps {
  // データ
  formData: MatchFormData;
  errors: MatchFormErrors;
  
  // 計算結果
  calculatedPoints: number | null;
  calculationDetails: any;
  showCalculation: boolean;
  provisionalPoints: number | null;
  provisionalDetails: any;
  showProvisionalCalculation: boolean;
  isCalculating: boolean;
  
  // UI状態
  loading: boolean;
  showNotification: boolean;
  notificationMessage: string;
  notificationType: 'success' | 'error';
  
  // イベントハンドラー
  onGameModeChange: (mode: GameMode) => void;
  onRulesetSelect: (ruleset: Ruleset) => void;
  onEntryMethodChange: (method: EntryMethod) => void;
  onMatchDateChange: (date: string) => void;
  onRankChange: (value: string) => void;
  onFinalPointsChange: (value: string) => void;
  onRawScoreChange: (value: string) => void;
  onChipCountChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onSubmit: () => void;
  
  // 設定
  submitButtonText: string;
  title?: string;
}

const MatchForm: React.FC<MatchFormProps> = ({
  formData,
  errors,
  calculatedPoints,
  calculationDetails,
  showCalculation,
  provisionalPoints,
  provisionalDetails,
  showProvisionalCalculation,
  isCalculating,
  loading,
  showNotification,
  notificationMessage,
  notificationType,
  onGameModeChange,
  onRulesetSelect,
  onEntryMethodChange,
  onMatchDateChange,
  onRankChange,
  onFinalPointsChange,
  onRawScoreChange,
  onChipCountChange,
  onMemoChange,
  onSubmit,
  submitButtonText,
  title,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const maxRank = formData.gameMode === 'four' ? 4 : 3;



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 通知 */}
      {showNotification && (
        <View style={[
          styles.notification,
          notificationType === 'success' ? styles.successNotification : styles.errorNotification
        ]}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {title && (
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}

        {/* ゲームモード選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ゲームモード</Text>
          <GameModeTab selectedMode={formData.gameMode} onModeChange={onGameModeChange} />
        </View>

        {/* 対局日選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>対局日</Text>
          <MatchDatePicker
            value={formData.matchDate}
            onChange={onMatchDateChange}
            error={errors.dateError}
          />
        </View>

        {/* ルール選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ルール</Text>
          <RuleSelector
            gameMode={formData.gameMode}
            selectedRulesetId={formData.selectedRuleset?.rulesetId}
            onRulesetSelect={onRulesetSelect}
          />
        </View>

        {/* 入力方式選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>入力方式</Text>
          <EntryMethodSelector
            selectedMethod={formData.entryMethod}
            gameMode={formData.gameMode}
            onMethodChange={onEntryMethodChange}
          />
        </View>

        {/* 順位入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>順位</Text>
          {formData.entryMethod === 'provisional_rank_only' && (
            <Text style={styles.provisionalDescription}>
              順位のみで仮のスコアを計算します。開始点からの増減: {formData.gameMode === 'three' ? '1位(+15000), 2位(+0), 3位(-15000)' : '1位(+15000), 2位(+5000), 3位(-5000), 4位(-15000)'}
            </Text>
          )}
          <TextInput
            style={[styles.input, errors.rankError ? styles.inputError : null]}
            value={formData.rank}
            onChangeText={onRankChange}
            placeholder={`1〜${maxRank}位`}
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={1}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {errors.rankError && <Text style={styles.errorText}>{errors.rankError}</Text>}
        </View>

        {/* 入力方式別フィールド */}
        {formData.entryMethod === 'rank_plus_points' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最終ポイント</Text>
            <TextInput
              style={[styles.input, errors.finalPointsError ? styles.inputError : null]}
              value={formData.finalPoints}
              onChangeText={onFinalPointsChange}
              placeholder="例: +25.0, -15.5"
              placeholderTextColor="#999"
              keyboardType="numeric"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {errors.finalPointsError && <Text style={styles.errorText}>{errors.finalPointsError}</Text>}
          </View>
        )}

        {formData.entryMethod === 'rank_plus_raw' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>素点</Text>
            <TextInput
              style={[styles.input, errors.rawScoreError ? styles.inputError : null]}
              value={formData.rawScore}
              onChangeText={onRawScoreChange}
              placeholder="例: 45000, -18000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {errors.rawScoreError && <Text style={styles.errorText}>{errors.rawScoreError}</Text>}
            {isCalculating && (
              <Text style={styles.calculatingText}>計算中...</Text>
            )}
          </View>
        )}

        {/* 計算結果表示（順位+素点方式） */}
        {formData.entryMethod === 'rank_plus_raw' && showCalculation && calculationDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>計算結果</Text>
            <View style={styles.calculationCard}>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>素点</Text>
                <Text style={styles.calculationValue}>
                  {calculationDetails.rawScore?.toLocaleString()}点
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>基準点</Text>
                <Text style={styles.calculationValue}>
                  {calculationDetails.basePoints?.toLocaleString()}点
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>基本計算</Text>
                <Text style={styles.calculationValue}>
                  {calculationDetails.baseCalculation}pt
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>ウマ</Text>
                <Text style={styles.calculationValue}>
                  {calculationDetails.uma >= 0 ? '+' : ''}{calculationDetails.uma}pt
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>オカ</Text>
                <Text style={styles.calculationValue}>
                  {calculationDetails.oka >= 0 ? '+' : ''}{calculationDetails.oka}pt
                </Text>
              </View>
              <View style={[styles.calculationRow, styles.calculationTotal]}>
                <Text style={styles.calculationTotalLabel}>最終ポイント</Text>
                <Text style={[
                  styles.calculationTotalValue,
                  { color: calculatedPoints && calculatedPoints >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {calculatedPoints !== null && calculatedPoints >= 0 ? '+' : ''}{calculatedPoints}pt
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 計算結果表示（順位のみ方式） */}
        {formData.entryMethod === 'provisional_rank_only' && showProvisionalCalculation && provisionalDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>計算結果（順位のみ）</Text>
            <View style={styles.calculationCard}>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>仮素点</Text>
                <Text style={styles.calculationValue}>
                  {provisionalDetails.provisionalRawScore?.toLocaleString()}点
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>基準点</Text>
                <Text style={styles.calculationValue}>
                  {provisionalDetails.basePoints?.toLocaleString()}点
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>基本計算</Text>
                <Text style={styles.calculationValue}>
                  {provisionalDetails.baseCalculation}pt
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>ウマ</Text>
                <Text style={styles.calculationValue}>
                  {provisionalDetails.uma >= 0 ? '+' : ''}{provisionalDetails.uma}pt
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>オカ</Text>
                <Text style={styles.calculationValue}>
                  {provisionalDetails.oka >= 0 ? '+' : ''}{provisionalDetails.oka}pt
                </Text>
              </View>
              <View style={[styles.calculationRow, styles.calculationTotal]}>
                <Text style={styles.calculationTotalLabel}>仮ポイント</Text>
                <Text style={[
                  styles.calculationTotalValue,
                  { color: provisionalPoints && provisionalPoints >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {provisionalPoints !== null && provisionalPoints >= 0 ? '+' : ''}{provisionalPoints}pt
                </Text>
              </View>
              <Text style={styles.provisionalWarning}>
                ※ これは仮の計算結果です。実際の素点とは異なる場合があります。
              </Text>
            </View>
          </View>
        )}

        {/* チップ入力（ルールでチップが有効な場合のみ） */}
        {formData.selectedRuleset?.useChips && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>チップ</Text>
            <TextInput
              style={styles.input}
              value={formData.chipCount}
              onChangeText={onChipCountChange}
              placeholder="チップ枚数"
              placeholderTextColor="#999"
              keyboardType="numeric"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        )}

        {/* メモ入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メモ（任意）</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={formData.memo}
            onChangeText={onMemoChange}
            placeholder="メモを入力"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="sentences"
          />
        </View>

        {/* 送信ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, loading ? styles.disabledButton : null]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{submitButtonText}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  notification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
  },
  successNotification: {
    backgroundColor: '#4CAF50',
  },
  errorNotification: {
    backgroundColor: '#FF9800',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
  },
  inputError: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
  },
  provisionalDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 16,
  },
  calculatingText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  calculationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666666',
  },
  calculationValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  calculationTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
    paddingTop: 8,
  },
  calculationTotalLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
  calculationTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  provisionalWarning: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 8,
    fontStyle: 'italic',
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});

export default MatchForm;