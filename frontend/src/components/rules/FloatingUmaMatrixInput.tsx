/**
 * 浮き人数別ウマ表の入力UIコンポーネント
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FloatingUmaMatrix } from '../../types/ruleset';

interface FloatingUmaMatrixInputProps {
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
  value: FloatingUmaMatrix;
  onChange: (value: FloatingUmaMatrix) => void;
  errors?: Record<string, string>;
}

export const FloatingUmaMatrixInput: React.FC<FloatingUmaMatrixInputProps> = ({
  gameMode,
  startingPoints,
  basePoints,
  value,
  onChange,
  errors = {},
}) => {
  // 内部的に文字列配列として保持（入力中の"-"を保持するため）
  const [stringMatrix, setStringMatrix] = React.useState<Record<string, string[]>>({});

  // 初期化：number[]をstring[]に変換
  React.useEffect(() => {
    const newStringMatrix: Record<string, string[]> = {};
    for (let i = 0; i <= 4; i++) {
      const key = String(i);
      newStringMatrix[key] = (value[key] || []).map(n => String(n));
    }
    setStringMatrix(newStringMatrix);
  }, []);
  // 有効な浮き人数の範囲を計算
  const getValidFloatingRange = (): [number, number] => {
    const playerCount = gameMode === 'three' ? 3 : 4;

    if (startingPoints === basePoints) {
      // 開始点=基準点: 浮き1〜playerCount
      return [1, playerCount];
    } else if (startingPoints < basePoints) {
      // 開始点<基準点: 浮き0〜(playerCount-1)
      return [0, playerCount - 1];
    } else {
      // 開始点>基準点: エラー（通常ありえない）
      return [1, playerCount];
    }
  };

  const [minFloating, maxFloating] = getValidFloatingRange();
  const playerCount = gameMode === 'three' ? 3 : 4;

  // 開始点・基準点変更時に使用されない浮き人数を0にリセット
  React.useEffect(() => {
    const newMatrix = { ...value };
    let hasChanges = false;

    for (let i = 0; i <= 4; i++) {
      const isUsed = i >= minFloating && i <= maxFloating;
      const key = String(i);

      if (!isUsed) {
        const zeroArray = Array(playerCount).fill(0);
        const currentArray = newMatrix[key] || [];

        // 使用されない浮き人数が0配列でない場合はリセット
        if (JSON.stringify(currentArray) !== JSON.stringify(zeroArray)) {
          newMatrix[key] = zeroArray;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      onChange(newMatrix);
    }
  }, [minFloating, maxFloating, playerCount]);

  // ウマ配列の更新
  const updateUmaArray = (floatingCount: number, rankIndex: number, text: string) => {
    const key = String(floatingCount);

    // 文字列配列を更新
    const newStringArray = [...(stringMatrix[key] || Array(playerCount).fill('0'))];
    newStringArray[rankIndex] = text;

    const newStringMatrix = {
      ...stringMatrix,
      [key]: newStringArray,
    };
    setStringMatrix(newStringMatrix);

    // 数値配列に変換して親に通知
    const newNumberArray = newStringArray.map(s => {
      const num = parseInt(s, 10);
      return isNaN(num) ? 0 : num;
    });

    onChange({
      ...value,
      [key]: newNumberArray,
    });
  };

  // 浮き人数が使用されるかどうか
  const isFloatingCountUsed = (floatingCount: number): boolean => {
    return floatingCount >= minFloating && floatingCount <= maxFloating;
  };

  // 浮き人数のラベル
  const getFloatingLabel = (floatingCount: number): string => {
    if (floatingCount === 0) return '浮き0人（全員沈み）';
    if (floatingCount === playerCount) return `浮き${playerCount}人（全員浮き）`;
    return `浮き${floatingCount}人`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>浮き人数別ウマ表</Text>
      <Text style={styles.subtitle}>
        {startingPoints === basePoints
          ? `浮き${minFloating}〜${maxFloating}人のウマを設定してください`
          : `浮き${minFloating}〜${maxFloating}人のウマを設定してください`}
      </Text>

      {[0, 1, 2, 3, 4].map((floatingCount) => {
        const isUsed = isFloatingCountUsed(floatingCount);

        // 使用されない浮き人数は非表示
        if (!isUsed) {
          return null;
        }

        const key = String(floatingCount);
        const stringArray = stringMatrix[key] || Array(playerCount).fill('0');

        return (
          <View key={floatingCount} style={styles.floatingRow}>
            <Text style={styles.floatingLabel}>
              {getFloatingLabel(floatingCount)}
            </Text>

            <View style={styles.umaInputs}>
              {stringArray.slice(0, playerCount).map((umaStr, rankIndex) => (
                <View key={rankIndex} style={styles.umaInputContainer}>
                  <Text style={styles.rankLabel}>
                    {rankIndex + 1}位
                  </Text>
                  <TextInput
                    style={[
                      styles.umaInput,
                      errors[`${key}-${rankIndex}`] && styles.umaInputError,
                    ]}
                    value={umaStr}
                    onChangeText={(text) => updateUmaArray(floatingCount, rankIndex, text)}
                    keyboardType="numeric"
                    editable={true}
                    placeholder="0"
                    placeholderTextColor="#999"
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* 浮きウマのバリデーションエラーを表示 */}
      {Object.keys(errors).filter(key => key.startsWith('umaMatrix_')).length > 0 && (
        <View style={styles.errorContainer}>
          {Object.keys(errors)
            .filter(key => key.startsWith('umaMatrix_'))
            .map((key) => (
              <Text key={key} style={styles.errorText}>
                {errors[key]}
              </Text>
            ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  floatingRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  floatingRowDisabled: {
    opacity: 0.5,
  },
  floatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  disabledText: {
    color: '#999',
  },
  umaInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  umaInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  rankLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  umaInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  umaInputDisabled: {
    backgroundColor: '#F2F2F7',
    color: '#999',
  },
  umaInputError: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  unusedNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#FF9800',
    marginBottom: 4,
  },
});
