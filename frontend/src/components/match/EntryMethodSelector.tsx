import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
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
  const [showHelpModal, setShowHelpModal] = useState(false);

  const entryMethods = [
    {
      value: 'rank_plus_points' as EntryMethod,
      title: '最終ポイント',
      description: '順位と最終ポイントを直接入力します。計算済みのポイントがある場合に便利です。',
    },
    {
      value: 'rank_plus_raw' as EntryMethod,
      title: '素点計算',
      description: '順位と素点を入力し、選択されたルールに基づいて自動でポイント計算を行います。',
    },
    {
      value: 'provisional_rank_only' as EntryMethod,
      title: '順位のみ',
      description: `順位のみで仮のポイントを計算します。${
        gameMode === 'three'
          ? '1位(+15000), 2位(±0), 3位(-15000)'
          : '1位(+15000), 2位(+5000), 3位(-5000), 4位(-15000)'
      }の増減値を使用します。`,
    },
  ];

  return (
    <View style={styles.container}>
      {/* ラベル + ヘルプアイコン */}
      <View style={styles.labelRow}>
        <Text style={styles.sectionTitle}>入力方式</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelpModal(true)}
        >
          <Text style={styles.helpIcon}>?</Text>
        </TouchableOpacity>
      </View>

      {/* 入力方式選択（1行レイアウト） */}
      <View style={styles.methodRow}>
        {entryMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.methodButton,
              selectedMethod === method.value && styles.activeMethod,
            ]}
            onPress={() => onMethodChange(method.value)}
          >
            <Text
              style={[
                styles.methodTitle,
                selectedMethod === method.value && styles.activeMethodTitle,
              ]}
            >
              {method.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ヘルプモーダル */}
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowHelpModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>入力方式について</Text>
            
            {entryMethods.map((method) => (
              <View key={method.value} style={styles.helpItem}>
                <Text style={styles.helpItemTitle}>■ {method.title}</Text>
                <Text style={styles.helpItemDescription}>{method.description}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  activeMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
  activeMethodTitle: {
    color: '#007AFF',
    fontWeight: '600',
  },
  helpButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // モーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpItem: {
    marginBottom: 16,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EntryMethodSelector;