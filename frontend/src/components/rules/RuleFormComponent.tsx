/**
 * ルールフォーム共通コンポーネント
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Switch,
    Modal,
} from 'react-native';
import { RuleFormData } from '@/src/hooks/useRuleForm';

interface RuleFormComponentProps {
    formData: RuleFormData;
    errors: Record<string, string>;
    isSubmitting: boolean;
    submitButtonText: string;
    onGameModeChange: (mode: 'three' | 'four') => void;
    onFieldChange: (field: keyof RuleFormData, value: any) => void;
    onUmaChange: (index: number, value: string) => void;
    onSubmit: () => void;
}

export default function RuleFormComponent({
    formData,
    errors,
    isSubmitting,
    submitButtonText,
    onGameModeChange,
    onFieldChange,
    onUmaChange,
    onSubmit,
}: RuleFormComponentProps) {
    const [showGameModeModal, setShowGameModeModal] = useState(false);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                {/* ルール名 */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>ルール名 *</Text>
                    <TextInput
                        style={[styles.input, errors.ruleName && styles.inputError]}
                        value={formData.ruleName}
                        onChangeText={(value) => onFieldChange('ruleName', value)}
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
                            {formData.gameMode === 'three' ? '3人麻雀' : '4人麻雀'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 開始点 */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>開始点 *</Text>
                    <TextInput
                        style={[styles.input, errors.startingPoints && styles.inputError]}
                        value={formData.startingPoints}
                        onChangeText={(value) => onFieldChange('startingPoints', value)}
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
                        value={formData.basePoints}
                        onChangeText={(value) => onFieldChange('basePoints', value)}
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
                        {formData.gameMode === 'three' ? '1位 / 2位 / 3位' : '1位 / 2位 / 3位 / 4位'}
                    </Text>
                    <View style={styles.umaContainer}>
                        {formData.uma.map((value, index) => (
                            <TextInput
                                key={index}
                                style={[styles.umaInput, errors.uma && styles.inputError]}
                                value={value}
                                onChangeText={(text) => onUmaChange(index, text)}
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
                        <Text style={styles.readOnlyText}>{formData.oka}</Text>
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
                            value={formData.useChips}
                            onValueChange={(value) => onFieldChange('useChips', value)}
                            trackColor={{ false: '#ccc', true: '#2196F3' }}
                            thumbColor={formData.useChips ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* メモ */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>メモ（任意）</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.memo}
                        onChangeText={(value) => onFieldChange('memo', value)}
                        placeholder="例: ○○店ルール"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* 送信ボタン */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={onSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? `${submitButtonText}中...` : submitButtonText}
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
                                onGameModeChange('three');
                                setShowGameModeModal(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>3人麻雀</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                onGameModeChange('four');
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    form: {
        padding: 12,
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
        gap: 6,
        flexWrap: 'wrap',
    },
    umaInput: {
        flex: 1,
        minWidth: 70,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
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
