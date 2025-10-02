import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EntryMethod } from '../../types/match';
import { GameMode } from '../../types/common';

interface EntryMethodSelectorProps {
  selectedMethod: EntryMethod;
  gameMode: GameMode;
  onMethodChange: (method: EntryMethod) => void;
}

const EntryMethodSelector: React.FC<EntryMethodSelectorProps> = ({
  selectedMethod,
  gameMode,
  onMethodChange,
}) => {
  const entryMethods = [
    {
      value: 'rank_plus_points' as EntryMethod,
      title: '順位+最終スコア',
      description: '順位と最終ポイントを直接入力します。計算済みのスコアがある場合に便利です。',
    },
    {
      value: 'rank_plus_raw' as EntryMethod,
      title: '順位+素点',
      description: '順位と素点を入力し、選択されたルールに基づいて自動でポイント計算を行います。',
    },
    {
      value: 'provisional_rank_only' as EntryMethod,
      title: '順位のみ',
      description: `順位のみで仮のスコアを計算します。${
        gameMode === 'three'
          ? '1位(+15000), 2位(±0), 3位(-15000)'
          : '1位(+15000), 2位(+5000), 3位(-5000), 4位(-15000)'
      }の増減値を使用します。`,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.methodContainer}>
        {entryMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.methodButton,
              selectedMethod === method.value && styles.activeMethod,
            ]}
            onPress={() => onMethodChange(method.value)}
          >
            <View style={styles.methodContent}>
              <Text
                style={[
                  styles.methodTitle,
                  selectedMethod === method.value && styles.activeMethodTitle,
                ]}
              >
                {method.title}
              </Text>
              <Text
                style={[
                  styles.methodDescription,
                  selectedMethod === method.value && styles.activeMethodDescription,
                ]}
              >
                {method.description}
              </Text>
            </View>
            {selectedMethod === method.value && (
              <View style={styles.selectedIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  methodContainer: {
    gap: 12,
  },
  methodButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  activeMethod: {
    borderColor: '#2196F3',
    backgroundColor: '#f3f8ff',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  activeMethodTitle: {
    color: '#2196F3',
  },
  methodDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  activeMethodDescription: {
    color: '#1976D2',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
  },
});

export default EntryMethodSelector;