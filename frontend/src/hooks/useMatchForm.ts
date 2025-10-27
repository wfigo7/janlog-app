import { useState, useEffect } from 'react';
import { EntryMethod, Match } from '../types/match';
import { GameMode } from '../types/common';
import { Ruleset, PointCalculationRequest } from '../types/ruleset';
import { rulesetService } from '../services/rulesetService';
import { MatchFormData, MatchFormErrors } from '../components/match/MatchForm';
import { useGameMode } from '../contexts/GameModeContext';

export interface UseMatchFormProps {
  initialData?: Partial<MatchFormData>;
  onSubmit: (data: MatchFormData) => Promise<void>;
  isEditMode?: boolean; // 編集モードかどうか（グローバルなgameMode変更の影響を受けない）
}

export const useMatchForm = ({ initialData, onSubmit, isEditMode = false }: UseMatchFormProps) => {
  const { gameMode } = useGameMode();
  
  // フォームデータ
  const [formData, setFormData] = useState<MatchFormData>(() => {
    const defaultData = {
      gameMode: gameMode,
      selectedRuleset: null,
      entryMethod: 'rank_plus_points' as EntryMethod,
      matchDate: (() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00+09:00`;
      })(),
      rank: '',
      finalPoints: '',
      rawScore: '',
      chipCount: '',
      venueName: '',
      memo: '',
    };
    
    // 初期データが提供されている場合は、それを優先して使用
    if (initialData) {
      return { ...defaultData, ...initialData };
    }
    
    return defaultData;
  });

  // ゲームモード変更時にフォームを初期化（編集モードでは無効）
  useEffect(() => {
    if (!isEditMode) {
      setFormData(prev => ({
        ...prev,
        gameMode: gameMode,
        selectedRuleset: null,
        rank: '',
        finalPoints: '',
        rawScore: '',
      }));
      clearCalculations();
    }
  }, [gameMode, isEditMode]);

  // 初期データが変更された時にフォームデータを更新
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      // 計算状態もクリア
      clearCalculations();
    }
  }, [initialData]);

  // エラー状態
  const [errors, setErrors] = useState<MatchFormErrors>({
    rankError: null,
    finalPointsError: null,
    rawScoreError: null,
    dateError: null,
  });

  // 計算結果
  const [calculatedPoints, setCalculatedPoints] = useState<number | null>(null);
  const [calculationDetails, setCalculationDetails] = useState<any>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [provisionalPoints, setProvisionalPoints] = useState<number | null>(null);
  const [provisionalDetails, setProvisionalDetails] = useState<any>(null);
  const [showProvisionalCalculation, setShowProvisionalCalculation] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // UI状態
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  const maxRank = formData.gameMode === 'four' ? 4 : 3;

  // バリデーション関数
  const validateRawScore = (score: string): { isValid: boolean; message?: string } => {
    if (!score) return { isValid: false };
    const num = parseInt(score);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    if (num < -999900 || num > 999900) {
      return { isValid: false, message: '6桁までの数値を入力してください（下2桁は00）' };
    }
    if (Math.abs(num) % 100 !== 0) {
      return { isValid: false, message: '6桁までの数値を入力してください（下2桁は00）' };
    }
    return { isValid: true };
  };

  const validateRank = (rankValue: string): { isValid: boolean; message?: string } => {
    if (!rankValue) return { isValid: false };
    const num = parseInt(rankValue);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    if (num < 1 || num > maxRank) {
      return { isValid: false, message: `1〜${maxRank}位で入力してください` };
    }
    return { isValid: true };
  };

  const validateFinalPoints = (points: string): { isValid: boolean; message?: string } => {
    if (!points) return { isValid: false };
    const num = parseFloat(points);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    if (num < -999.9 || num > 999.9) {
      return { isValid: false, message: '3桁までの数値を入力してください' };
    }
    const decimalPlaces = (points.split('.')[1] || '').length;
    if (decimalPlaces > 1) {
      return { isValid: false, message: '3桁までの数値を入力してください' };
    }
    return { isValid: true };
  };

  const validateMatchDate = (dateString: string): { isValid: boolean; message?: string } => {
    if (!dateString) return { isValid: false, message: '対局日を選択してください' };
    
    const date = new Date(dateString);
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    if (date > now) {
      return { isValid: false, message: '未来の日付は選択できません' };
    }
    if (date < fiveYearsAgo) {
      return { isValid: false, message: '5年以上前の日付は選択できません' };
    }
    return { isValid: true };
  };

  // 自動計算ロジック
  const calculatePointsAutomatically = async (
    ruleset: Ruleset,
    rankValue: string,
    rawScoreValue: string
  ) => {
    const rankNum = parseInt(rankValue);

    if (!ruleset || !rankValue || !rawScoreValue || rankNum < 1 || rankNum > maxRank) {
      setCalculatedPoints(null);
      setCalculationDetails(null);
      setShowCalculation(false);
      return;
    }

    const scoreValidation = validateRawScore(rawScoreValue);
    if (!scoreValidation.isValid) {
      setCalculatedPoints(null);
      setCalculationDetails(null);
      setShowCalculation(false);
      setErrors(prev => ({ ...prev, rawScoreError: scoreValidation.message || null }));
      return;
    }

    setErrors(prev => ({ ...prev, rawScoreError: null }));
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

    if (!ruleset || !rankValue || rankNum < 1 || rankNum > maxRank) {
      setProvisionalPoints(null);
      setProvisionalDetails(null);
      setShowProvisionalCalculation(false);
      return;
    }

    setIsCalculating(true);
    try {
      let provisionalRawScore: number;

      if (formData.gameMode === 'three') {
        if (rankNum === 1) {
          provisionalRawScore = ruleset.startingPoints + 15000;
        } else if (rankNum === 2) {
          provisionalRawScore = ruleset.startingPoints;
        } else {
          provisionalRawScore = ruleset.startingPoints - 15000;
        }
      } else {
        if (rankNum === 1) {
          provisionalRawScore = ruleset.startingPoints + 15000;
        } else if (rankNum === 2) {
          provisionalRawScore = ruleset.startingPoints + 5000;
        } else if (rankNum === 3) {
          provisionalRawScore = ruleset.startingPoints - 5000;
        } else {
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

  // 自動計算のuseEffect
  useEffect(() => {
    if (formData.entryMethod === 'rank_plus_raw' && formData.selectedRuleset) {
      const timeoutId = setTimeout(() => {
        calculatePointsAutomatically(formData.selectedRuleset!, formData.rank, formData.rawScore);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.selectedRuleset, formData.rank, formData.rawScore, formData.entryMethod, maxRank]);

  useEffect(() => {
    if (formData.entryMethod === 'provisional_rank_only' && formData.selectedRuleset) {
      const timeoutId = setTimeout(() => {
        calculateProvisionalPointsAutomatically(formData.selectedRuleset!, formData.rank);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.selectedRuleset, formData.rank, formData.entryMethod, maxRank]);

  // イベントハンドラー
  const handleRulesetSelect = (ruleset: Ruleset) => {
    setFormData(prev => ({ ...prev, selectedRuleset: ruleset }));
    clearCalculations();
  };

  const handleEntryMethodChange = (method: EntryMethod) => {
    setFormData(prev => ({ 
      ...prev, 
      entryMethod: method,
      finalPoints: '',
      rawScore: ''
    }));
    clearCalculations();
    setErrors(prev => ({ ...prev, rawScoreError: null, finalPointsError: null }));
  };

  const handleRankChange = (value: string) => {
    setFormData(prev => ({ ...prev, rank: value }));
    if (value) {
      const validation = validateRank(value);
      setErrors(prev => ({ ...prev, rankError: validation.isValid ? null : validation.message || null }));
    } else {
      setErrors(prev => ({ ...prev, rankError: null }));
    }
  };

  const handleFinalPointsChange = (value: string) => {
    setFormData(prev => ({ ...prev, finalPoints: value }));
    if (value) {
      const validation = validateFinalPoints(value);
      setErrors(prev => ({ ...prev, finalPointsError: validation.isValid ? null : validation.message || null }));
    } else {
      setErrors(prev => ({ ...prev, finalPointsError: null }));
    }
  };

  const handleRawScoreChange = (value: string) => {
    setFormData(prev => ({ ...prev, rawScore: value }));
    if (value) {
      const validation = validateRawScore(value);
      setErrors(prev => ({ ...prev, rawScoreError: validation.isValid ? null : validation.message || null }));
    } else {
      setErrors(prev => ({ ...prev, rawScoreError: null }));
    }
  };

  const handleMatchDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, matchDate: date }));
    const validation = validateMatchDate(date);
    setErrors(prev => ({ ...prev, dateError: validation.isValid ? null : validation.message || null }));
  };

  const clearCalculations = () => {
    setCalculatedPoints(null);
    setCalculationDetails(null);
    setShowCalculation(false);
    setProvisionalPoints(null);
    setProvisionalDetails(null);
    setShowProvisionalCalculation(false);
  };

  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message);
    setNotificationType('success');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const showErrorNotification = (message: string) => {
    setNotificationMessage(message);
    setNotificationType('error');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const validateForm = (): boolean => {
    const newErrors: MatchFormErrors = {
      rankError: null,
      finalPointsError: null,
      rawScoreError: null,
      dateError: null,
    };

    const dateValidation = validateMatchDate(formData.matchDate);
    if (!dateValidation.isValid) {
      newErrors.dateError = dateValidation.message || null;
    }

    if (!formData.selectedRuleset) {
      showErrorNotification('ルールを選択してください');
      return false;
    }

    const rankValidation = validateRank(formData.rank);
    if (!rankValidation.isValid) {
      newErrors.rankError = rankValidation.message || null;
    }

    if (formData.entryMethod === 'rank_plus_points') {
      const pointsValidation = validateFinalPoints(formData.finalPoints);
      if (!pointsValidation.isValid) {
        newErrors.finalPointsError = pointsValidation.message || null;
      }
    } else if (formData.entryMethod === 'rank_plus_raw') {
      const rawValidation = validateRawScore(formData.rawScore);
      if (!rawValidation.isValid) {
        newErrors.rawScoreError = rawValidation.message || null;
      }
    } else if (formData.entryMethod === 'provisional_rank_only') {
      if (provisionalPoints === null) {
        showErrorNotification('ポイントが計算されていません。順位と素点を正しく入力してください');
        return false;
      }
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error !== null);
    if (hasErrors) {
      showErrorNotification('入力エラーがあります');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('送信エラー:', error);
      showErrorNotification('送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return {
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
    handleRulesetSelect,
    handleEntryMethodChange,
    handleMatchDateChange,
    handleRankChange,
    handleFinalPointsChange,
    handleRawScoreChange,
    handleChipCountChange: (value: string) => setFormData(prev => ({ ...prev, chipCount: value })),
    handleVenueNameChange: (value: string | undefined) => setFormData(prev => ({ ...prev, venueName: value || '' })),
    handleMemoChange: (value: string) => setFormData(prev => ({ ...prev, memo: value })),
    handleSubmit,
    showSuccessNotification,
    showErrorNotification,
    setFormData,
  };
};