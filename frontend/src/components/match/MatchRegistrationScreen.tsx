import React, { useState, useEffect, useRef } from 'react';
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
import { MatchInput, EntryMethod } from '../../types/match';
import { GameMode } from '../../types/common';
import { Ruleset, PointCalculationRequest } from '../../types/ruleset';
import { MatchService } from '../../services/matchService';
import { rulesetService } from '../../services/rulesetService';
import RuleSelector from './RuleSelector';

const MatchRegistrationScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);


  const [gameMode, setGameMode] = useState<GameMode>('four');
  const [selectedRuleset, setSelectedRuleset] = useState<Ruleset | null>(null);
  const [entryMethod, setEntryMethod] = useState<EntryMethod>('rank_plus_points');
  const [rank, setRank] = useState<string>('');
  const [finalPoints, setFinalPoints] = useState<string>('');
  const [rawScore, setRawScore] = useState<string>('');
  const [chipCount, setChipCount] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [calculatedPoints, setCalculatedPoints] = useState<number | null>(null);
  const [calculationDetails, setCalculationDetails] = useState<any>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [provisionalPoints, setProvisionalPoints] = useState<number | null>(null);
  const [provisionalDetails, setProvisionalDetails] = useState<any>(null);
  const [showProvisionalCalculation, setShowProvisionalCalculation] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [rawScoreError, setRawScoreError] = useState<string | null>(null);
  const [rankError, setRankError] = useState<string | null>(null);
  const [finalPointsError, setFinalPointsError] = useState<string | null>(null);


  const maxRank = gameMode === 'four' ? 4 : 3;

  const handleGameModeChange = (newGameMode: GameMode) => {
    setGameMode(newGameMode);
    // ゲームモード変更時は選択されたルールセットをクリア
    setSelectedRuleset(null);
    // 計算結果もクリア
    setCalculatedPoints(null);
    setCalculationDetails(null);
    setShowCalculation(false);
  };

  const handleEntryMethodChange = (newEntryMethod: EntryMethod) => {
    setEntryMethod(newEntryMethod);
    // 入力方式変更時は入力値と計算結果をクリア
    setFinalPoints('');
    setRawScore('');
    setCalculatedPoints(null);
    setCalculationDetails(null);
    setShowCalculation(false);
    setProvisionalPoints(null);
    setProvisionalDetails(null);
    setShowProvisionalCalculation(false);
    setRawScoreError(null);
    setRankError(null);
    setFinalPointsError(null);
  };

  const handleRankChange = (value: string) => {
    setRank(value);

    // 順位のバリデーション
    if (value) {
      const validation = validateRank(value);
      setRankError(validation.isValid ? null : validation.message || null);
    } else {
      setRankError(null);
    }
  };

  const handleFinalPointsChange = (value: string) => {
    setFinalPoints(value);

    // 最終ポイントのバリデーション
    if (value) {
      const validation = validateFinalPoints(value);
      setFinalPointsError(validation.isValid ? null : validation.message || null);
    } else {
      setFinalPointsError(null);
    }
  };

  const handleRulesetSelect = (ruleset: Ruleset) => {
    setSelectedRuleset(ruleset);
    // ルール変更時は計算結果をクリア
    setCalculatedPoints(null);
    setCalculationDetails(null);
    setShowCalculation(false);
    setProvisionalPoints(null);
    setProvisionalDetails(null);
    setShowProvisionalCalculation(false);
    setRawScoreError(null);
    setRankError(null);
  };

  // 素点のバリデーション関数
  const validateRawScore = (score: string): { isValid: boolean; message?: string } => {
    if (!score) {
      return { isValid: false };
    }

    const num = parseInt(score);

    if (isNaN(num)) {
      return { isValid: false, message: '数値を入力してください' };
    }

    // -999900〜999900の範囲チェック
    if (num < -999900 || num > 999900) {
      return { isValid: false, message: '6桁までの数値を入力してください（下2桁は00）' };
    }

    // 下2桁が00でない場合はエラー
    if (Math.abs(num) % 100 !== 0) {
      return { isValid: false, message: '6桁までの数値を入力してください（下2桁は00）' };
    }

    return { isValid: true };
  };

  // 順位のバリデーション関数
  const validateRank = (rankValue: string): { isValid: boolean; message?: string } => {
    if (!rankValue) {
      return { isValid: false };
    }

    const num = parseInt(rankValue);

    if (isNaN(num)) {
      return { isValid: false, message: '数値を入力してください' };
    }

    if (num < 1 || num > maxRank) {
      return { isValid: false, message: `1〜${maxRank}位で入力してください` };
    }

    return { isValid: true };
  };

  // 最終ポイントのバリデーション関数
  const validateFinalPoints = (points: string): { isValid: boolean; message?: string } => {
    if (!points) return { isValid: false };

    const num = parseFloat(points);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };

    // -999.9〜999.9の範囲チェック
    if (num < -999.9 || num > 999.9) {
      return { isValid: false, message: '3桁までの数値を入力してください' };
    }

    // 小数点第1位までかチェック
    const decimalPlaces = (points.split('.')[1] || '').length;
    if (decimalPlaces > 1) {
      return { isValid: false, message: '3桁までの数値を入力してください' };
    }

    return { isValid: true };
  };

  const calculatePointsAutomatically = async (
    ruleset: Ruleset,
    rankValue: string,
    rawScoreValue: string
  ) => {
    const rankNum = parseInt(rankValue);

    // 基本バリデーション
    if (
      !ruleset ||
      !rankValue ||
      !rawScoreValue ||
      rankNum < 1 ||
      rankNum > maxRank
    ) {
      setCalculatedPoints(null);
      setCalculationDetails(null);
      setShowCalculation(false);
      return;
    }

    // 素点のバリデーション
    const scoreValidation = validateRawScore(rawScoreValue);
    if (!scoreValidation.isValid) {
      setCalculatedPoints(null);
      setCalculationDetails(null);
      setShowCalculation(false);
      setRawScoreError(scoreValidation.message || null);
      return;
    }

    // バリデーション成功時はエラーをクリア
    setRawScoreError(null);

    const rawScoreNum = parseInt(rawScoreValue);

    setIsCalculating(true);
    try {
      const request: PointCalculationRequest = {
        rulesetId: ruleset.rulesetId,
        rank: rankNum,
        rawScore: rawScoreNum,
      };

      const response = await rulesetService.calculatePoints(request);
      setCalculatedPoints(response.finalPoints);
      setCalculationDetails(response.calculation);
      setShowCalculation(true);
    } catch (error) {
      console.error('ポイント計算エラー:', error);
      setCalculatedPoints(null);
      setCalculationDetails(null);
      setShowCalculation(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateProvisionalPointsAutomatically = async (
    ruleset: Ruleset,
    rankValue: string
  ) => {
    const rankNum = parseInt(rankValue);

    // 基本バリデーション
    if (!ruleset || !rankValue || rankNum < 1 || rankNum > maxRank) {
      setProvisionalPoints(null);
      setProvisionalDetails(null);
      setShowProvisionalCalculation(false);
      return;
    }

    setIsCalculating(true);
    try {
      // 仮の素点を計算（開始点からの増減）
      let provisionalRawScore: number;

      if (gameMode === 'three') {
        // 3人麻雀: +15000, 0, -15000
        if (rankNum === 1) {
          provisionalRawScore = ruleset.startingPoints + 15000;
        } else if (rankNum === 2) {
          provisionalRawScore = ruleset.startingPoints;
        } else { // rankNum === 3
          provisionalRawScore = ruleset.startingPoints - 15000;
        }
      } else {
        // 4人麻雀: +15000, +5000, -5000, -15000
        if (rankNum === 1) {
          provisionalRawScore = ruleset.startingPoints + 15000;
        } else if (rankNum === 2) {
          provisionalRawScore = ruleset.startingPoints + 5000;
        } else if (rankNum === 3) {
          provisionalRawScore = ruleset.startingPoints - 5000;
        } else { // rankNum === 4
          provisionalRawScore = ruleset.startingPoints - 15000;
        }
      }

      const request: PointCalculationRequest = {
        rulesetId: ruleset.rulesetId,
        rank: rankNum,
        rawScore: provisionalRawScore,
      };

      const response = await rulesetService.calculatePoints(request);
      setProvisionalPoints(response.finalPoints);
      setProvisionalDetails({
        ...response.calculation,
        isProvisional: true,
        provisionalRawScore: provisionalRawScore,
      });
      setShowProvisionalCalculation(true);
    } catch (error) {
      console.error('仮スコア計算エラー:', error);
      setProvisionalPoints(null);
      setProvisionalDetails(null);
      setShowProvisionalCalculation(false);
    } finally {
      setIsCalculating(false);
    }
  };

  // 自動計算のためのuseEffect
  useEffect(() => {
    if (entryMethod === 'rank_plus_raw' && selectedRuleset) {
      const timeoutId = setTimeout(() => {
        calculatePointsAutomatically(selectedRuleset, rank, rawScore);
      }, 500); // 500ms のデバウンス

      return () => clearTimeout(timeoutId);
    }
  }, [selectedRuleset, rank, rawScore, entryMethod, maxRank]);

  // 仮スコア計算のためのuseEffect
  useEffect(() => {
    if (entryMethod === 'provisional_rank_only' && selectedRuleset) {
      const timeoutId = setTimeout(() => {
        calculateProvisionalPointsAutomatically(selectedRuleset, rank);
      }, 300); // 300ms のデバウンス

      return () => clearTimeout(timeoutId);
    }
  }, [selectedRuleset, rank, entryMethod, maxRank]);

  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // 3秒後に自動で消える
  };

  const scrollToErrorField = (sectionType: 'rank' | 'finalPoints' | 'rawScore') => {
    if (!scrollViewRef.current) {
      return;
    }

    // 各セクションの推定位置（固定値）
    const positions = {
      rank: 350,        // ゲームモード + ルール選択 + 入力方式選択 + 順位
      finalPoints: 450, // 上記 + 順位セクション
      rawScore: 450,    // 上記 + 順位セクション（素点は最終スコアと同じ位置）
    };

    const targetY = positions[sectionType];

    scrollViewRef.current.scrollTo({
      y: targetY,
      animated: true,
    });
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!selectedRuleset) {
      showNotificationMessage('ルールを選択してください', 'error');
      // ルール選択は画面上部なので、トップにスクロール
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // 順位のバリデーション
    const rankValidation = validateRank(rank);
    if (!rankValidation.isValid) {
      showNotificationMessage('入力エラーがあります', 'error');
      scrollToErrorField('rank');
      return;
    }

    // 入力方式に応じたバリデーション
    let finalPointsValue: number | undefined;
    let rawScoreValue: number | undefined;

    if (entryMethod === 'rank_plus_points') {
      const finalPointsValidation = validateFinalPoints(finalPoints);
      if (!finalPointsValidation.isValid) {
        showNotificationMessage('入力エラーがあります', 'error');
        scrollToErrorField('finalPoints');
        return;
      }
      finalPointsValue = parseFloat(finalPoints);
    } else if (entryMethod === 'rank_plus_raw') {
      const scoreValidation = validateRawScore(rawScore);
      if (!scoreValidation.isValid) {
        showNotificationMessage('入力エラーがあります', 'error');
        scrollToErrorField('rawScore');
        return;
      }
      if (calculatedPoints === null) {
        showNotificationMessage('入力エラーがあります', 'error');
        scrollToErrorField('rawScore');
        return;
      }
      rawScoreValue = parseInt(rawScore);
      finalPointsValue = calculatedPoints;
    } else if (entryMethod === 'provisional_rank_only') {
      // 仮スコア方式は順位のみでOK（バックエンドで計算される）
      finalPointsValue = undefined;
    }

    setLoading(true);
    try {
      const matchData: MatchInput = {
        gameMode,
        entryMethod,
        rulesetId: selectedRuleset.rulesetId,
        rank: parseInt(rank),
        finalPoints: finalPointsValue,
        rawScore: rawScoreValue,
        chipCount: chipCount ? parseInt(chipCount) : undefined,
        memo: memo || undefined,
      };

      // 実際のAPI呼び出し
      const result = await MatchService.createMatch(matchData);

      if (result.success) {
        // フォームをリセット
        setRank('');
        setFinalPoints('');
        setRawScore('');
        setChipCount('');
        setMemo('');
        setCalculatedPoints(null);
        setCalculationDetails(null);
        setShowCalculation(false);
        setProvisionalPoints(null);
        setProvisionalDetails(null);
        setShowProvisionalCalculation(false);
        // ルールセットはリセットしない（同じルールで連続登録することが多いため）

        // 成功通知を表示
        showNotificationMessage('対局を登録しました');
      } else {
        Alert.alert('エラー', result.message || '対局の登録に失敗しました');
      }
    } catch (error) {
      console.error('対局登録エラー:', error);
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
      {/* 通知ポップアップ */}
      {showNotification && (
        <View style={styles.notificationContainer}>
          <View style={[
            styles.notification,
            notificationType === 'error' && styles.notificationError
          ]}>
            <Text style={styles.notificationText}>{notificationMessage}</Text>
          </View>
        </View>
      )}

      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        {/* ゲームモード選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ゲームモード</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, gameMode === 'four' && styles.activeTab]}
              onPress={() => handleGameModeChange('four')}
            >
              <Text style={[styles.tabText, gameMode === 'four' && styles.activeTabText]}>
                4人麻雀
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, gameMode === 'three' && styles.activeTab]}
              onPress={() => handleGameModeChange('three')}
            >
              <Text style={[styles.tabText, gameMode === 'three' && styles.activeTabText]}>
                3人麻雀
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ルール選択 */}
        <View style={styles.section}>
          <RuleSelector
            gameMode={gameMode}
            selectedRulesetId={selectedRuleset?.rulesetId}
            onRulesetSelect={handleRulesetSelect}
          />
        </View>

        {/* 入力方式選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>入力方式</Text>
          <View style={styles.entryMethodContainer}>
            <TouchableOpacity
              style={[
                styles.entryMethodButton,
                entryMethod === 'rank_plus_points' && styles.activeEntryMethod,
              ]}
              onPress={() => handleEntryMethodChange('rank_plus_points')}
            >
              <Text
                style={[
                  styles.entryMethodText,
                  entryMethod === 'rank_plus_points' && styles.activeEntryMethodText,
                ]}
              >
                順位+最終スコア
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.entryMethodButton,
                entryMethod === 'rank_plus_raw' && styles.activeEntryMethod,
              ]}
              onPress={() => handleEntryMethodChange('rank_plus_raw')}
            >
              <Text
                style={[
                  styles.entryMethodText,
                  entryMethod === 'rank_plus_raw' && styles.activeEntryMethodText,
                ]}
              >
                順位+素点
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.entryMethodButton,
                entryMethod === 'provisional_rank_only' && styles.activeEntryMethod,
              ]}
              onPress={() => handleEntryMethodChange('provisional_rank_only')}
            >
              <Text
                style={[
                  styles.entryMethodText,
                  entryMethod === 'provisional_rank_only' && styles.activeEntryMethodText,
                ]}
              >
                順位のみ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 順位入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>順位</Text>
          <TextInput
            style={[
              styles.input,
              rankError && styles.inputError
            ]}
            value={rank}
            onChangeText={handleRankChange}
            placeholder={`1〜${maxRank}位`}
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={1}
          />
          {rankError && (
            <Text style={styles.errorText}>{rankError}</Text>
          )}
        </View>

        {/* 入力方式に応じた入力欄 */}
        {entryMethod === 'rank_plus_points' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最終スコア</Text>
            <TextInput
              style={[
                styles.input,
                finalPointsError && styles.inputError
              ]}
              value={finalPoints}
              onChangeText={handleFinalPointsChange}
              placeholder="例: +25.0, 0, -15.0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            {finalPointsError && (
              <Text style={styles.errorText}>{finalPointsError}</Text>
            )}
          </View>
        )}

        {entryMethod === 'rank_plus_raw' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>素点</Text>
              <TextInput
                style={[
                  styles.input,
                  rawScoreError && styles.inputError
                ]}
                value={rawScore}
                onChangeText={setRawScore}
                placeholder="例: 45000, 0, -18100（100点単位）"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {rawScoreError && (
                <Text style={styles.errorText}>{rawScoreError}</Text>
              )}
              {isCalculating && (
                <Text style={styles.calculatingText}>計算中...</Text>
              )}
            </View>

            {/* 計算結果表示 */}
            {showCalculation && calculationDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>計算結果</Text>
                <View style={styles.calculationResult}>
                  <Text style={styles.calculationTitle}>
                    最終ポイント: {calculatedPoints}pt
                  </Text>
                  <Text style={styles.calculationFormula}>
                    {calculationDetails.formula}
                  </Text>
                  <View style={styles.calculationDetails}>
                    <Text style={styles.calculationDetailText}>
                      素点: {calculationDetails.rawScore}点
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      基準点: {calculationDetails.basePoints}点
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      基本計算: {calculationDetails.baseCalculation}pt
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      ウマ: {calculationDetails.umaPoints}pt
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      オカ: {calculationDetails.okaPoints}pt
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {entryMethod === 'provisional_rank_only' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>順位のみ入力</Text>
              <Text style={styles.provisionalNote}>
                順位のみで仮のスコアを計算します。{'\n'}
                {gameMode === 'three'
                  ? '3人麻雀: 1位(+15000), 2位(±0), 3位(-15000)'
                  : '4人麻雀: 1位(+15000), 2位(+5000), 3位(-5000), 4位(-15000)'
                }{'\n'}
                開始点からの増減で仮素点を設定し、選択されたルールでポイント計算します。
              </Text>
              {isCalculating && (
                <Text style={styles.calculatingText}>計算中...</Text>
              )}
            </View>

            {/* 仮スコア計算結果表示 */}
            {showProvisionalCalculation && provisionalDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>計算結果（順位のみ）</Text>
                <View style={styles.calculationResult}>
                  <Text style={styles.calculationTitle}>
                    仮ポイント: {provisionalPoints}pt
                  </Text>
                  <Text style={styles.calculationFormula}>
                    {provisionalDetails.formula}
                  </Text>
                  <View style={styles.calculationDetails}>
                    <Text style={styles.calculationDetailText}>
                      仮素点: {provisionalDetails.provisionalRawScore}点
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      基準点: {provisionalDetails.basePoints}点
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      基本計算: {provisionalDetails.baseCalculation}pt
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      ウマ: {provisionalDetails.umaPoints}pt
                    </Text>
                    <Text style={styles.calculationDetailText}>
                      オカ: {provisionalDetails.okaPoints}pt
                    </Text>
                  </View>
                  <Text style={styles.provisionalWarning}>
                    ※ これは仮の計算結果です。実際の素点とは異なる場合があります。
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* チップ数入力 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>チップ数（任意）</Text>
          <TextInput
            style={styles.input}
            value={chipCount}
            onChangeText={setChipCount}
            placeholder="例: 5"
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
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
  entryMethodContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  entryMethodButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeEntryMethod: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  entryMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeEntryMethodText: {
    color: '#fff',
  },
  calculatingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  calculationResult: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calculationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  calculationFormula: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  calculationDetails: {
    gap: 4,
  },
  calculationDetailText: {
    fontSize: 12,
    color: '#666',
  },
  provisionalNote: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  provisionalWarning: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    left: 16,
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  notification: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: '80%',
  },
  notificationError: {
    backgroundColor: '#FF9800',
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 2,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default MatchRegistrationScreen;