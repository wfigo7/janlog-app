/**
 * 浮き人数入力コンポーネント
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { GameMode } from '@/src/types/common';

interface FloatingCountInputProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    gameMode: GameMode;
    startingPoints: number;
    basePoints: number;
    rawScore?: number;
    error?: string;
}

export const FloatingCountInput: React.FC<FloatingCountInputProps> = ({
    value,
    onChange,
    onBlur,
    gameMode,
    startingPoints,
    basePoints,
    rawScore,
    error,
}) => {
    /**
     * 有効な浮き人数の範囲を取得
     */
    const getValidFloatingRange = (): { min: number; max: number } => {
        const playerCount = gameMode === 'three' ? 3 : 4;

        if (startingPoints === basePoints) {
            // 開始点=基準点: 全員原点は「全員浮き」とみなす
            return { min: 1, max: playerCount };
        } else if (startingPoints < basePoints) {
            // 開始点<基準点: 全員沈みはあり、全員浮きは存在しない
            return { min: 0, max: playerCount - 1 };
        } else {
            // 開始点>基準点: 理論上ありえない
            return { min: 0, max: 0 };
        }
    };

    /**
     * 自身の浮き判定
     */
    const getPlayerFloatingStatus = (): string | null => {
        if (rawScore === undefined) return null;

        if (rawScore >= basePoints) {
            return '自身は浮き';
        } else {
            return '自身は沈み';
        }
    };

    const range = getValidFloatingRange();
    const floatingStatus = getPlayerFloatingStatus();

    return (
        <View style={styles.container}>
            <Text style={styles.label}>浮き人数 *</Text>
            <Text style={styles.hint}>
                {range.min}〜{range.max}人の範囲で入力してください
            </Text>

            <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={`${range.min}〜${range.max}`}
                placeholderTextColor="#999"
                keyboardType="numeric"
            />

            {floatingStatus && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                        {floatingStatus}（素点: {rawScore?.toLocaleString()}点）
                    </Text>
                </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
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
    statusContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#1976D2',
        fontWeight: '500',
    },
    errorText: {
        color: '#f44336',
        fontSize: 12,
        marginTop: 4,
    },
});
