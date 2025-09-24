import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Match, MatchInput } from '../../types/match';
import { MatchService } from '../../services/matchService';
import { rulesetService } from '../../services/rulesetService';
import { useMatchForm } from '../../hooks/useMatchForm';
import MatchForm, { MatchFormData } from './MatchForm';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const MatchEditScreen: React.FC = () => {
  const { matchId } = useLocalSearchParams();
  const matchIdString = Array.isArray(matchId) ? matchId[0] : matchId as string;
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();

  // 初期データ読み込み状態
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<MatchFormData> | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    if (matchIdString) {
      loadMatchData();
    }
  }, [matchIdString]);

  const loadMatchData = async () => {
    try {
      setInitialLoading(true);
      const response = await MatchService.getMatchById(matchIdString);

      if (response.success && response.data) {
        const match = response.data;

        // ルールセットを読み込み
        const rulesetResponse = await rulesetService.getRulesets();
        let selectedRuleset = null;
        if (rulesetResponse && rulesetResponse.rulesets) {
          selectedRuleset = rulesetResponse.rulesets.find(r => r.rulesetId === match.rulesetId) || null;
        }

        // フォームデータに変換
        const formData: Partial<MatchFormData> = {
          gameMode: match.gameMode,
          selectedRuleset,
          entryMethod: match.entryMethod,
          matchDate: match.date,
          rank: match.rank.toString(),
          finalPoints: match.finalPoints?.toString() || '',
          rawScore: match.rawScore?.toString() || '',
          chipCount: match.chipCount?.toString() || '',
          memo: match.memo || '',
        };

        setInitialData(formData);
      } else {
        throw new Error(response.message || '対局データの取得に失敗しました');
      }
    } catch (error) {
      console.error('対局データ読み込みエラー:', error);
      showAlert({
        title: 'エラー',
        message: '対局データの読み込みに失敗しました',
        buttons: [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (formData: MatchFormData) => {
    // 最終ポイントの計算
    let finalPointsValue: number | undefined;
    if (formData.entryMethod === 'rank_plus_points') {
      finalPointsValue = parseFloat(formData.finalPoints);
    } else if (formData.entryMethod === 'rank_plus_raw') {
      finalPointsValue = calculatedPoints ?? undefined;
    } else if (formData.entryMethod === 'provisional_rank_only') {
      finalPointsValue = provisionalPoints ?? undefined;
    } else {
      finalPointsValue = undefined;
    }

    const matchInput: MatchInput = {
      gameMode: formData.gameMode,
      entryMethod: formData.entryMethod,
      date: formData.matchDate,
      rank: parseInt(formData.rank),
      rulesetId: formData.selectedRuleset!.rulesetId,
      finalPoints: finalPointsValue,
      rawScore: formData.entryMethod === 'rank_plus_raw' ? parseInt(formData.rawScore) : undefined,
      chipCount: formData.chipCount ? parseInt(formData.chipCount) : undefined,
      memo: formData.memo || undefined,
    };

    const response = await MatchService.updateMatch(matchIdString, matchInput);

    if (response.success) {
      showSuccessNotification('対局を更新しました');
      setTimeout(() => {
        router.back();
      }, 1500);
    } else {
      throw new Error(response.message || '更新に失敗しました');
    }
  };

  const {
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
    handleGameModeChange,
    handleRulesetSelect,
    handleEntryMethodChange,
    handleMatchDateChange,
    handleRankChange,
    handleFinalPointsChange,
    handleRawScoreChange,
    handleChipCountChange,
    handleMemoChange,
    handleSubmit: submitForm,
    showSuccessNotification,
    setFormData,
  } = useMatchForm({
    initialData: initialData || undefined,
    onSubmit: handleSubmit,
  });

  // 初期データが設定された後に、フォームデータを強制的に更新
  useEffect(() => {
    if (initialData && !initialLoading) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData, initialLoading, setFormData]);

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>対局データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <>
      <MatchForm
        formData={formData}
        errors={errors}
        calculatedPoints={calculatedPoints}
        calculationDetails={calculationDetails}
        showCalculation={showCalculation}
        provisionalPoints={provisionalPoints}
        provisionalDetails={provisionalDetails}
        showProvisionalCalculation={showProvisionalCalculation}
        isCalculating={isCalculating}
        loading={loading}
        showNotification={showNotification}
        notificationMessage={notificationMessage}
        notificationType={notificationType}
        onGameModeChange={handleGameModeChange}
        onRulesetSelect={handleRulesetSelect}
        onEntryMethodChange={handleEntryMethodChange}
        onMatchDateChange={handleMatchDateChange}
        onRankChange={handleRankChange}
        onFinalPointsChange={handleFinalPointsChange}
        onRawScoreChange={handleRawScoreChange}
        onChipCountChange={handleChipCountChange}
        onMemoChange={handleMemoChange}
        onSubmit={submitForm}
        submitButtonText="更新"
      />
      <AlertComponent />
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default MatchEditScreen;