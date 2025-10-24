/**
 * ルール作成・編集フォーム（共通コンポーネント）
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Switch,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { rulesetService } from '@/src/services/rulesetService';
import { Ruleset } from '@/src/types/ruleset';
import { useCustomAlert } from '@/src/hooks/useCustomAlert';
import { useAuth } from '@/src/contexts/AuthContext';

interface RuleFormScreenProps {
    mode: 'create' | 'edit';
    rulesetId?: string;
}

export default function RuleFormScreen({ mode, rulesetId }: RuleFormScreenProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert, AlertComponent } = useCustomAlert();

    const [isLoading, setIsLoading] = useState(mode === 'edit');
    const [originalRule, setOriginalRule] = useState<Ruleset | null>(null);

    // フォーム状態
    const [ruleName, setRuleName] = useState('');
    const [gameMode, setGameMode] = useState<'three' | 'four'>('four');
    const [startingPoints, setStartingPoints] = useState('25000');
    const [basePoints, setBasePoints] = useState('30000');
    const [uma, setUma] = useState<string[]>(['30', '10', '-10', '-30']);
    const [oka, setOka] = useState('20');
    const [useChips, setUseChips] = useState(false);
    const [memo, setMemo] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showGameModeModal, setShowGameModeModal] = useState(false);

    /**
     * 編集モード時のルールデータ読み込み
     */
    useEffect(() => {
        if (mode === 'edit' && rulesetId) {
            loadRule();
        }
    }, [mode, rulesetId]);

    const loadRule = async () => {
        if (!rulesetId) {
            showAlert({
                title: 'エラー',
                message: 'ルールIDが指定されていません',
                buttons: [{ text: 'OK', onPress: () => router.back() }],
            });
            return;
        }

        try {
            setIsLoading(true);
            const rule = await rulesetService.getRuleset(rulesetId);

            // グローバルルールの編集権限チェック
            if (rule.isGlobal && user?.role !== 'admin') {
                showAlert({
                    title: 'エラー',
                    message: 'グローバルルールは編集できません',
                    buttons: [{ text: 'OK', onPress: () => router.back() }],
                });
                return;
            }

            setOriginalRule(rule);
            setRuleName(rule.ruleName);
            setGameMode(rule.gameMode);
            setStartingPoints(rule.startingPoints.toString());
            setBasePoints(rule.basePoints.toString());
            setUma(rule.uma.map(u => u.toString()));
            setOka(rule.oka.toString());
            setUseChips(rule.useChips);
            setMemo(rule.memo || '');
        } catch (error) {
            console.error('Failed to load rule:', error);
            showAlert({
                title: 'エラー',
                message: 'ルールの読み込みに失敗しました',
                buttons: [{ text: 'OK', onPress: () => router.back() }],
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ゲームモード変更時の処理
     */
    const handleGameModeChange = (newMode: 'three' | 'four') => {
        setGameMode(newMode);
        
        // ゲームモードに応じたデフォルト値で全て上書き
        if (newMode === 'three') {
            setStartingPoints('35000');
            setBasePoints('40000');
            setUma(['20', '0', '-20']);
            setOka('15');
        } else {
            setStartingPoints('25000');
            setBasePoints('30000');
            setUma(['30', '10', '-10', '-30']);
            setOka('20');
        }
    };

    /**
     * 開始点・基準点変更時のオカ自動計算
     */
    const handlePointsChange = (start: string, base: string) => {
        const startNum = parseInt(start, 10);
        const baseNum = parseInt(base, 10);

        if (isNaN(startNum) || isNaN(baseNum)) return;

        const diff = baseNum - startNum;
        const calculatedOka = (diff * (gameMode === 'three' ? 3 : 4)) / 1000;
        setOka(calculatedOka.toString());
    };

    /**
     * バリデーション
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!ruleName.trim()) {
            newErrors.ruleName = 'ルール名を入力してください';
        }

        const startNum = parseInt(startingPoints, 10);
        if (isNaN(startNum) || startNum <= 0) {
            newErrors.startingPoints = '開始点は正の数値を入力してください';
        }

        const baseNum = parseInt(basePoints, 10);
        if (isNaN(baseNum) || baseNum <= 0) {
            newErrors.basePoints = '基準点は正の数値を入力してください';
        }

        const expectedLength = gameMode === 'three' ? 3 : 4;
        if (uma.length !== expectedLength) {
            newErrors.uma = `${gameMode === 'three' ? '3' : '4'}人麻雀のウマは${expectedLength}つ必要です`;
        }

        const umaNumbers = uma.map(u => parseInt(u, 10));
        if (umaNumbers.some(isNaN)) {
            newErrors.uma = 'ウマは数値で入力してください';
        } else {
            const umaSum = umaNumbers.reduce((sum, num) => sum + num, 0);
            if (umaSum !== 0) {
                newErrors.uma = `ウマの合計は0である必要があります（現在: ${umaSum > 0 ? '+' : ''}${umaSum}）`;
            }
        }

        const okaNum = parseInt(oka, 10);
        if (isNaN(okaNum)) {
            newErrors.oka = 'オカは数値で入力してください';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * 保存処理
     */
    const handleSubmit = async () => {
        if (!validateForm()) {
            showAlert({
                title: '入力エラー',
                message: '入力内容を確認してください',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const ruleData: Omit<Ruleset, 'rulesetId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
                ruleName: ruleName.trim(),
                gameMode,
                startingPoints: parseInt(startingPoints, 10),
                basePoints: parseInt(basePoints, 10),
                useFloatingUma: false,
                uma: uma.map(u => parseInt(u, 10)),
                oka: parseInt(oka, 10),
                useChips,
                memo: memo.trim() || undefined,
                isGlobal: mode === 'edit' ? (originalRule?.isGlobal ?? false) : false,
            };

            if (mode === 'create') {
                await rulesetService.createRuleset(ruleData);
                showAlert({
                    title: '成功',
                    message: 'ルールを作成しました',
                    buttons: [{ text: 'OK', onPress: () => router.back() }],
                });
            } else {
                if (!rulesetId) {
                    throw new Error('ルールIDが指定されていません');
                }
                await rulesetService.updateRuleset(rulesetId, ruleData);
                showAlert({
                    title: '成功',
                    message: 'ルールを更新しました',
                    buttons: [{ text: 'OK', onPress: () => router.back() }],
                });
            }
        } catch (error) {
            console.error(`Failed to ${mode} rule:`, error);
            const errorMessage = error instanceof Error ? error.message : `ルールの${mode === 'create' ? '作成' : '更新'}に失敗しました`;
            showAlert({
                title: 'エラー',
                message: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <AlertComponent />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            </>
        );
    }

    return (
        <>
            <AlertComponent />
            <ScrollView style={styles.container}>
                <View style={styles.form}>
                    {/* ルール名 */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>ルール名 *</Text>
                        <TextInput
                            style={[styles.input, errors.ruleName && styles.inputError]}
                            value={ruleName}
                            onChangeText={setRuleName}
                            placeholder="例: Mリーグルール"
                            placeholderTextColor="#999"
                        />
                        {errors.ruleName && <Text style={styles.errorText}>{errors.ruleName}</Text>}
                    </View>

                    {/* ゲームモード */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>ゲームモード *</Text>
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setShowGameModeModal(true)}
                        >
                            <Text style={styles.selectButtonText}>
                                {gameMode === 'three' ? '3人麻雀' : '4人麻雀'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 開始点 */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>開始点 *</Text>
                        <TextInput
                            style={[styles.input, errors.startingPoints && styles.inputError]}
                            value={startingPoints}
                            onChangeText={(value) => {
                                setStartingPoints(value);
                                handlePointsChange(value, basePoints);
                            }}
                            placeholder="25000"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                        {errors.startingPoints && <Text style={styles.errorText}>{errors.startingPoints}</Text>}
                    </View>

                    {/* 基準点 */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>基準点 *</Text>
                        <TextInput
                            style={[styles.input, errors.basePoints && styles.inputError]}
                            value={basePoints}
                            onChangeText={(value) => {
                                setBasePoints(value);
                                handlePointsChange(startingPoints, value);
                            }}
                            placeholder="30000"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                        {errors.basePoints && <Text style={styles.errorText}>{errors.basePoints}</Text>}
                    </View>

                    {/* ウマ */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>ウマ *</Text>
                        <Text style={styles.hint}>
                            {gameMode === 'three' ? '1位 / 2位 / 3位' : '1位 / 2位 / 3位 / 4位'}
                        </Text>
                        <View style={styles.umaContainer}>
                            {uma.map((value, index) => (
                                <TextInput
                                    key={index}
                                    style={[styles.umaInput, errors.uma && styles.inputError]}
                                    value={value}
                                    onChangeText={(text) => {
                                        const newUma = [...uma];
                                        newUma[index] = text;
                                        setUma(newUma);
                                    }}
                                    placeholder={index === 0 ? '+30' : index === 1 ? '+10' : '-10'}
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            ))}
                        </View>
                        {errors.uma && <Text style={styles.errorText}>{errors.uma}</Text>}
                    </View>

                    {/* オカ */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>オカ（自動計算）</Text>
                        <View style={[styles.input, styles.readOnlyInput]}>
                            <Text style={styles.readOnlyText}>{oka}</Text>
                        </View>
                        <Text style={styles.hint}>
                            オカは開始点と基準点の差から自動計算されます
                        </Text>
                    </View>

                    {/* チップ */}
                    <View style={styles.formGroup}>
                        <View style={styles.switchRow}>
                            <Text style={styles.label}>チップを使用する</Text>
                            <Switch
                                value={useChips}
                                onValueChange={setUseChips}
                                trackColor={{ false: '#ccc', true: '#2196F3' }}
                                thumbColor={useChips ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    </View>

                    {/* メモ */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>メモ（任意）</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={memo}
                            onChangeText={setMemo}
                            placeholder="例: ○○店ルール"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* 保存ボタン */}
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting 
                                ? (mode === 'create' ? '作成中...' : '更新中...') 
                                : (mode === 'create' ? '作成' : '更新')
                            }
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ゲームモード選択モーダル */}
                <Modal
                    visible={showGameModeModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowGameModeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>ゲームモードを選択</Text>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    handleGameModeChange('three');
                                    setShowGameModeModal(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>3人麻雀</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    handleGameModeChange('four');
                                    setShowGameModeModal(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>4人麻雀</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowGameModeModal(false)}
                            >
                                <Text style={styles.modalCancelText}>キャンセル</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    form: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    inputError: {
        borderColor: '#f44336',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    selectButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        minHeight: 50,
        justifyContent: 'center',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#333',
    },
    umaContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    umaInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorText: {
        color: '#f44336',
        fontSize: 12,
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    modalCancelButton: {
        padding: 16,
        marginTop: 8,
    },
    modalCancelText: {
        fontSize: 16,
        color: '#f44336',
        textAlign: 'center',
        fontWeight: '600',
    },
    readOnlyInput: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    readOnlyText: {
        fontSize: 16,
        color: '#666',
    },
});
