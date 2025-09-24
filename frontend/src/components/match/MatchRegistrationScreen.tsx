import React from 'react';
import { MatchInput } from '../../types/match';
import { MatchService } from '../../services/matchService';
import { useMatchForm } from '../../hooks/useMatchForm';
import MatchForm from './MatchForm';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const MatchRegistrationScreen: React.FC = () => {
  const { showAlert, AlertComponent } = useCustomAlert();

  const handleSubmit = async (formData: any) => {
    // 最終ポイントの計算
    let finalPointsValue: number | undefined;
    if (formData.entryMethod === 'rank_plus_points') {
      finalPointsValue = parseFloat(formData.finalPoints);
    } else if (formData.entryMethod === 'rank_plus_raw') {
      // 計算されたポイントを使用（useMatchFormで管理）
      finalPointsValue = calculatedPoints ?? undefined;
    } else if (formData.entryMethod === 'provisional_rank_only') {
      // 仮スコアのポイントを使用
      finalPointsValue = provisionalPoints ?? undefined;
    } else {
      finalPointsValue = undefined;
    }

    const matchData: MatchInput = {
      date: formData.matchDate,
      gameMode: formData.gameMode,
      entryMethod: formData.entryMethod,
      rulesetId: formData.selectedRuleset!.rulesetId,
      rank: parseInt(formData.rank),
      finalPoints: finalPointsValue,
      rawScore: formData.entryMethod === 'rank_plus_raw' ? parseInt(formData.rawScore) : undefined,
      chipCount: formData.chipCount ? parseInt(formData.chipCount) : undefined,
      memo: formData.memo || undefined,
    };

    const result = await MatchService.createMatch(matchData);

    if (result.success) {
      // フォームをリセット（ルールセットは保持）
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        matchDate: `${year}-${month}-${day}T00:00:00+09:00`,
        rank: '',
        finalPoints: '',
        rawScore: '',
        chipCount: '',
        memo: '',
      }));

      showSuccessNotification('対局を登録しました');
    } else {
      throw new Error(result.message || '対局の登録に失敗しました');
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
    onSubmit: handleSubmit,
  });

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
        submitButtonText="登録"
      />
      <AlertComponent />
    </>
  );
};

export default MatchRegistrationScreen;