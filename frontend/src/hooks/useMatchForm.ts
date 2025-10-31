import { useState, useEffect } from 'react';
import { EntryMethod, Match } from '../types/match';
import { GameMode } from '../types/common';
import { Ruleset, PointCalculationRequest } from '../types/ruleset';
import { rulesetService } from '../services/rulesetService';
import { MatchFormData, MatchFormErrors } from '../components/match/MatchForm';
import { useGameMode } from '../contexts/GameModeContext';
import { MatchValidator } from '../utils/matchValidator';

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
      floatingCount: '',
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
        floatingCount: '',
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
    floatingCountError: null,
    dateError: null,
  });

  // タッチ状態（フィールドがフォーカスされたかどうか）
  const [touched, setTouched] = useState({
    floatingCount: false,
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

  // バリデーション関数（MatchValidatorを使用）
  const validateRawScore = (score: string): { isValid: boolean; message?: string } => {
    if (!score) return { isValid: false };
    const num = parseInt(score);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    
    const result = MatchValidator.validateRawScore(num);
    if (!result.isValid && result.errors.length > 0) {
      return { isValid: false, message: result.errors[0].message };
    }
    return { isValid: true };
  };

  const validateRank = (rankValue: string): { isValid: boolean; message?: string } => {
    if (!rankValue) return { isValid: false };
    const num = parseInt(rankValue);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    
    const result = MatchValidator.validateRank(num, formData.gameMode);
    if (!result.isValid && result.errors.length > 0) {
      return { isValid: false, message: result.errors[0].message };
    }
    return { isValid: true };
  };

  const validateFinalPoints = (points: string): { isValid: boolean; message?: string } => {
    if (!points) return { isValid: false };
    const num = parseFloat(points);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    
    const result = MatchValidator.validateFinalPoints(num);
    if (!result.isValid && result.errors.length > 0) {
      return { isValid: false, message: result.errors[0].message };
    }
    return { isValid: true };
  };

  const validateMatchDate = (dateString: string): { isValid: boolean; message?: string } => {
    if (!dateString) return { isValid: false, message: '対局日を選択してください' };

    const result = MatchValidator.validateDate(dateString);
    if (!result.isValid && result.errors.length > 0) {
      return { isValid: false, message: result.errors[0].message };
    }
    return { isValid: true };
  };

  const validateFloatingCountField = (count: string): { isValid: boolean; message?: string } => {
    if (!count) return { isValid: false, message: '浮き人数を入力してください' };
    const num = parseInt(count);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };

    const result = MatchValidator.validateFloatingCount(num, formData.gameMode);
    if (!result.isValid && result.errors.length > 0) {
      return { isValid: false, message: result.errors[0].message };
    }
    return { isValid: true };
  };



  const validateFloatingCount = (
    floatingCountValue: string,
    ruleset: Ruleset | null
  ): { isValid: boolean; message?: string } => {
    if (!ruleset?.useFloatingUma) {
      return { isValid: true }; // 浮きウマ使用しない場合はバリデーション不要
    }

    if (!floatingCountValue) {
      return { isValid: false, message: '浮き人数を入力してください' };
    }

    const num = parseInt(floatingCountValue);
    if (isNaN(num)) {
      return { isValid: false, message: '数値を入力してください' };
    }

    // 有効範囲を計算
    const playerCount = formData.gameMode === 'three' ? 3 : 4;
    let minCount: number;
    let maxCount: number;

    if (ruleset.startingPoints === ruleset.basePoints) {
      minCount = 1;
      maxCount = playerCount;
    } else if (ruleset.startingPoints < ruleset.basePoints) {
      minCount = 0;
      maxCount = playerCount - 1;
    } else {
      return { isValid: false, message: '開始点は基準点以下である必要があります' };
    }

    if (num < minCount || num > maxCount) {
      return { isValid: false, message: `${minCount}〜${maxCount}人の範囲で入力してください` };
    }

    return { isValid: true };
  };

  // 自動計算ロジック
  const calculatePointsAutomatically = async (
    ruleset: Ruleset,
    rankValue: string,
    rawScoreValue: string,
    floatingCountValue?: string
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

    // 浮きウマルール使用時は浮き人数のバリデーション（タッチされている場合のみエラー表示）
    if (ruleset.useFloatingUma) {
      const floatingValidation = validateFloatingCount(floatingCountValue || '', ruleset);
      if (!floatingValidation.isValid) {
        setCalculatedPoints(null);
        setCalculationDetails(null);
        setShowCalculation(false);
        // タッチされている場合のみエラーを表示
        if (touched.floatingCount) {
          setErrors(prev => ({ ...prev, floatingCountError: floatingValidation.message || null }));
        }
        return;
      }
      setErrors(prev => ({ ...prev, floatingCountError: null }));
    }

    const rawScoreNum = parseInt(rawScoreValue);

    setIsCalculating(true);
    try {
      const request: PointCalculationRequest = {
        rulesetId: ruleset.rulesetId,
        rank: rankNum,
        rawScore: rawScoreNum,
        floatingCount: floatingCountValue ? parseInt(floatingCountValue) : undefined,
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
    rankValue: string,
    floatingCountValue?: string
  ) => {
    const rankNum = parseInt(rankValue);

    if (!ruleset || !rankValue || rankNum < 1 || rankNum > maxRank) {
      setProvisionalPoints(null);
      setProvisionalDetails(null);
      setShowProvisionalCalculation(false);
      return;
    }

    // 浮きウマルール使用時は浮き人数のバリデーション（タッチされている場合のみエラー表示）
    if (ruleset.useFloatingUma) {
      const floatingValidation = validateFloatingCount(floatingCountValue || '', ruleset);
      if (!floatingValidation.isValid) {
        setProvisionalPoints(null);
        setProvisionalDetails(null);
        setShowProvisionalCalculation(false);
        // タッチされている場合のみエラーを表示
        if (touched.floatingCount) {
          setErrors(prev => ({ ...prev, floatingCountError: floatingValidation.message || null }));
        }
        return;
      }
      setErrors(prev => ({ ...prev, floatingCountError: null }));
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
        floatingCount: floatingCountValue ? parseInt(floatingCountValue) : undefined,
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
      console.error('仮ポイント計算エラー:', error);
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
        calculatePointsAutomatically(formData.selectedRuleset!, formData.rank, formData.rawScore, formData.floatingCount);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.selectedRuleset, formData.rank, formData.rawScore, formData.floatingCount, formData.entryMethod, maxRank]);

  useEffect(() => {
    if (formData.entryMethod === 'provisional_rank_only' && formData.selectedRuleset) {
      const timeoutId = setTimeout(() => {
        calculateProvisionalPointsAutomatically(formData.selectedRuleset!, formData.rank, formData.floatingCount);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.selectedRuleset, formData.rank, formData.floatingCount, formData.entryMethod, maxRank]);

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
      rawScore: '',
      floatingCount: '',
    }));
    clearCalculations();
    setErrors(prev => ({ ...prev, rawScoreError: null, finalPointsError: null, floatingCountError: null }));
    setTouched(prev => ({ ...prev, floatingCount: false }));
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
      floatingCountError: null,
      dateError: null,
    };

    if (!formData.selectedRuleset) {
      showErrorNotification('ルールを選択してください');
      return false;
    }

    // 包括的バリデーションを実行
    const validationInput = {
      date: formData.matchDate,
      gameMode: formData.gameMode,
      entryMethod: formData.entryMethod,
      rank: parseInt(formData.rank) || 0,
      finalPoints: formData.finalPoints ? parseFloat(formData.finalPoints) : undefined,
      rawScore: formData.rawScore ? parseInt(formData.rawScore) : undefined,
      floatingCount: formData.floatingCount ? parseInt(formData.floatingCount) : undefined,
      chipCount: formData.chipCount ? parseInt(formData.chipCount) : undefined,
      ruleset: formData.selectedRuleset,
    };

    const validationResult = MatchValidator.validate(validationInput);

    // エラーをフォームエラーにマッピング
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => {
        switch (error.field) {
          case 'date':
            newErrors.dateError = error.message;
            break;
          case 'rank':
            newErrors.rankError = error.message;
            break;
          case 'finalPoints':
            newErrors.finalPointsError = error.message;
            break;
          case 'rawScore':
            newErrors.rawScoreError = error.message;
            break;
          case 'floatingCount':
            newErrors.floatingCountError = error.message;
            break;
        }
      });

      setErrors(newErrors);
      showErrorNotification('入力エラーがあります');
      return false;
    }

    // 仮ポイントの場合は計算結果が必要
    if (formData.entryMethod === 'provisional_rank_only' && provisionalPoints === null) {
      showErrorNotification('ポイントが計算されていません。順位と浮き人数を正しく入力してください');
      return false;
    }

    setErrors(newErrors);
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
    handleFloatingCountChange: (value: string) => {
      setFormData(prev => ({ ...prev, floatingCount: value }));
      // タッチされた後のみバリデーション
      if (touched.floatingCount) {
        if (value) {
          const validation = validateFloatingCount(value, formData.selectedRuleset);
          setErrors(prev => ({ ...prev, floatingCountError: validation.isValid ? null : validation.message || null }));
        } else {
          const validation = validateFloatingCount(value, formData.selectedRuleset);
          setErrors(prev => ({ ...prev, floatingCountError: validation.message || null }));
        }
      }
    },
    handleFloatingCountBlur: () => {
      setTouched(prev => ({ ...prev, floatingCount: true }));
      // ブラー時にバリデーション実行
      const validation = validateFloatingCount(formData.floatingCount, formData.selectedRuleset);
      setErrors(prev => ({ ...prev, floatingCountError: validation.isValid ? null : validation.message || null }));
    },
    handleChipCountChange: (value: string) => setFormData(prev => ({ ...prev, chipCount: value })),
    handleVenueNameChange: (value: string | undefined) => setFormData(prev => ({ ...prev, venueName: value || '' })),
    handleMemoChange: (value: string) => setFormData(prev => ({ ...prev, memo: value })),
    handleSubmit,
    showSuccessNotification,
    showErrorNotification,
    setFormData,
  };
};