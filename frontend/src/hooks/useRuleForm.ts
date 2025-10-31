/**
 * ルールフォーム用カスタムフック
 */

import { useState, useEffect } from 'react';
import { Ruleset } from '../types/ruleset';
import { useGameMode } from '../contexts/GameModeContext';

interface UseRuleFormProps {
    initialRule?: Ruleset | null;
    onSubmit: (formData: RuleFormData) => Promise<void>;
    isEditMode?: boolean; // 編集モードかどうか
}

export interface RuleFormData {
    ruleName: string;
    gameMode: 'three' | 'four';
    startingPoints: string;
    basePoints: string;
    useFloatingUma: boolean;
    uma: string[];
    umaMatrix: Record<string, number[]>;
    oka: string;
    useChips: boolean;
    memo: string;
}

export function useRuleForm({ initialRule, onSubmit, isEditMode = false }: UseRuleFormProps) {
    const { gameMode: globalGameMode } = useGameMode();

    const [formData, setFormData] = useState<RuleFormData>({
        ruleName: '',
        gameMode: isEditMode ? 'four' : globalGameMode, // 新規作成時はグローバルなgameModeを使用
        startingPoints: '25000',
        basePoints: '30000',
        useFloatingUma: false,
        uma: ['30', '10', '-10', '-30'],
        umaMatrix: {
            '0': [0, 0, 0, 0],
            '1': [0, 0, 0, 0],
            '2': [0, 0, 0, 0],
            '3': [0, 0, 0, 0],
            '4': [0, 0, 0, 0],
        },
        oka: '20',
        useChips: false,
        memo: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * ゲームモード変更時の処理
     */
    const handleGameModeChange = (mode: 'three' | 'four') => {
        console.log('handleGameModeChange called with:', mode);
        const playerCount = mode === 'three' ? 3 : 4;
        const defaultUmaMatrix: Record<string, number[]> = {
            '0': Array(playerCount).fill(0),
            '1': Array(playerCount).fill(0),
            '2': Array(playerCount).fill(0),
            '3': Array(playerCount).fill(0),
            '4': Array(playerCount).fill(0),
        };

        if (mode === 'three') {
            setFormData({
                ...formData,
                gameMode: mode,
                startingPoints: '35000',
                basePoints: '40000',
                uma: ['20', '0', '-20'],
                umaMatrix: defaultUmaMatrix,
                oka: '15',
            });
        } else {
            setFormData({
                ...formData,
                gameMode: mode,
                startingPoints: '25000',
                basePoints: '30000',
                uma: ['30', '10', '-10', '-30'],
                umaMatrix: defaultUmaMatrix,
                oka: '20',
            });
        }
    };

    // グローバルなgameMode変更時の処理（新規作成時のみ）
    useEffect(() => {
        console.log('useRuleForm useEffect:', { isEditMode, initialRule, globalGameMode });
        if (!isEditMode && !initialRule) {
            console.log('useRuleForm: calling handleGameModeChange with', globalGameMode);
            handleGameModeChange(globalGameMode);
        }
    }, [globalGameMode, isEditMode, initialRule]);

    // 初期データの読み込み
    useEffect(() => {
        if (initialRule) {
            const playerCount = initialRule.gameMode === 'three' ? 3 : 4;
            const defaultUmaMatrix: Record<string, number[]> = {
                '0': Array(playerCount).fill(0),
                '1': Array(playerCount).fill(0),
                '2': Array(playerCount).fill(0),
                '3': Array(playerCount).fill(0),
                '4': Array(playerCount).fill(0),
            };

            setFormData({
                ruleName: initialRule.ruleName,
                gameMode: initialRule.gameMode,
                startingPoints: initialRule.startingPoints.toString(),
                basePoints: initialRule.basePoints.toString(),
                useFloatingUma: initialRule.useFloatingUma || false,
                uma: initialRule.uma.map(u => u.toString()),
                umaMatrix: initialRule.umaMatrix || defaultUmaMatrix,
                oka: initialRule.oka.toString(),
                useChips: initialRule.useChips,
                memo: initialRule.memo || '',
            });
        }
    }, [initialRule]);



    /**
     * 開始点・基準点変更時のオカ自動計算
     */
    const calculateOka = (start: string, base: string, gameMode: 'three' | 'four') => {
        const startNum = parseInt(start, 10);
        const baseNum = parseInt(base, 10);

        if (isNaN(startNum) || isNaN(baseNum)) return;

        const diff = baseNum - startNum;
        const calculatedOka = (diff * (gameMode === 'three' ? 3 : 4)) / 1000;
        return calculatedOka.toString();
    };

    /**
     * フィールド更新
     */
    const updateField = (field: keyof RuleFormData, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // 開始点または基準点が変更された場合、オカを再計算
            if (field === 'startingPoints' || field === 'basePoints') {
                const newOka = calculateOka(
                    field === 'startingPoints' ? value : prev.startingPoints,
                    field === 'basePoints' ? value : prev.basePoints,
                    prev.gameMode
                );
                if (newOka) {
                    newData.oka = newOka;
                }
            }

            return newData;
        });
    };

    /**
     * ウマ配列の更新
     */
    const updateUma = (index: number, value: string) => {
        setFormData(prev => {
            const newUma = [...prev.uma];
            newUma[index] = value;
            return { ...prev, uma: newUma };
        });
    };

    /**
     * バリデーション
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.ruleName.trim()) {
            newErrors.ruleName = 'ルール名を入力してください';
        }

        const startNum = parseInt(formData.startingPoints, 10);
        if (isNaN(startNum) || startNum <= 0) {
            newErrors.startingPoints = '開始点は正の数値を入力してください';
        }

        const baseNum = parseInt(formData.basePoints, 10);
        if (isNaN(baseNum) || baseNum <= 0) {
            newErrors.basePoints = '基準点は正の数値を入力してください';
        }

        const expectedLength = formData.gameMode === 'three' ? 3 : 4;
        if (formData.uma.length !== expectedLength) {
            newErrors.uma = `${formData.gameMode === 'three' ? '3' : '4'}人麻雀のウマは${expectedLength}つ必要です`;
        }

        const umaNumbers = formData.uma.map(u => parseInt(u, 10));
        if (umaNumbers.some(isNaN)) {
            newErrors.uma = 'ウマは数値で入力してください';
        } else {
            const umaSum = umaNumbers.reduce((sum, num) => sum + num, 0);
            if (umaSum !== 0) {
                newErrors.uma = `ウマの合計は0である必要があります（現在: ${umaSum > 0 ? '+' : ''}${umaSum}）`;
            }
        }

        const okaNum = parseInt(formData.oka, 10);
        if (isNaN(okaNum)) {
            newErrors.oka = 'オカは数値で入力してください';
        }

        // 浮きウマのバリデーション
        if (formData.useFloatingUma) {
            const playerCount = formData.gameMode === 'three' ? 3 : 4;
            const startNum = parseInt(formData.startingPoints, 10);
            const baseNum = parseInt(formData.basePoints, 10);

            // 有効な浮き人数範囲を計算
            let minFloating = 1;
            let maxFloating = playerCount;

            if (startNum === baseNum) {
                minFloating = 1;
                maxFloating = playerCount;
            } else if (startNum < baseNum) {
                minFloating = 0;
                maxFloating = playerCount - 1;
            }

            // 各浮き人数のウマ配列をバリデーション
            for (let i = minFloating; i <= maxFloating; i++) {
                const key = String(i);
                const umaArray = formData.umaMatrix[key];

                if (!umaArray || umaArray.length !== playerCount) {
                    newErrors[`umaMatrix_${key}`] = `浮き${i}人のウマ配列は${playerCount}要素である必要があります`;
                    continue;
                }

                const sum = umaArray.reduce((acc, val) => acc + val, 0);
                if (sum !== 0) {
                    newErrors[`umaMatrix_${key}`] = `浮き${i}人のウマ配列の合計は0である必要があります（現在: ${sum > 0 ? '+' : ''}${sum}）`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * フォーム送信
     */
    const handleSubmit = async () => {
        if (!validateForm()) {
            return false;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            return true;
        } catch (error) {
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        errors,
        isSubmitting,
        handleGameModeChange,
        updateField,
        updateUma,
        handleSubmit,
    };
}
