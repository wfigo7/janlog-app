import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ruleset } from '../../types/ruleset';
import { GameMode } from '../../types/common';
import { rulesetService } from '../../services/rulesetService';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface RuleSelectorProps {
  gameMode: GameMode;
  selectedRulesetId?: string;
  onRulesetSelect: (ruleset: Ruleset) => void;
}

const RuleSelector: React.FC<RuleSelectorProps> = ({
  gameMode,
  selectedRulesetId,
  onRulesetSelect,
}) => {
  const { showAlert, AlertComponent } = useCustomAlert();
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [filteredRulesets, setFilteredRulesets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRuleset, setSelectedRuleset] = useState<Ruleset | null>(null);

  // ルールセット一覧を取得
  const fetchRulesets = async () => {
    setLoading(true);
    try {
      const response = await rulesetService.getRulesets();
      setRulesets(response.rulesets);
    } catch (error) {
      showAlert({
        title: 'エラー',
        message: 'ルールセットの取得に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  };

  // ゲームモードでフィルタリング
  useEffect(() => {
    const filtered = rulesetService.filterRulesetsByGameMode(rulesets, gameMode);
    setFilteredRulesets(filtered);

    // 選択されているルールセットがフィルタ結果に含まれない場合はクリア
    if (selectedRuleset && selectedRuleset.gameMode !== gameMode) {
      setSelectedRuleset(null);
    }
  }, [rulesets, gameMode, selectedRuleset]);

  // 選択されているルールセットを設定
  useEffect(() => {
    if (selectedRulesetId && rulesets.length > 0) {
      const ruleset = rulesets.find(r => r.rulesetId === selectedRulesetId);
      if (ruleset) {
        setSelectedRuleset(ruleset);
      }
    } else if (!selectedRulesetId) {
      setSelectedRuleset(null);
    }
  }, [selectedRulesetId, rulesets]);

  // 初回読み込み
  useEffect(() => {
    fetchRulesets();
  }, []);

  const handleRulesetSelect = (ruleset: Ruleset) => {
    setSelectedRuleset(ruleset);
    onRulesetSelect(ruleset);
    setModalVisible(false);
  };

  const renderRulesetItem = ({ item }: { item: Ruleset }) => (
    <TouchableOpacity
      style={[
        styles.rulesetItem,
        selectedRuleset?.rulesetId === item.rulesetId && styles.selectedRulesetItem
      ]}
      onPress={() => handleRulesetSelect(item)}
    >
      <View style={styles.rulesetHeader}>
        <Text style={styles.rulesetName}>{item.ruleName}</Text>
        {item.isGlobal && (
          <View style={styles.globalBadge}>
            <Text style={styles.globalBadgeText}>公式</Text>
          </View>
        )}
      </View>

      <View style={styles.rulesetDetails}>
        <Text style={styles.rulesetDetail}>
          {item.startingPoints}点持ち{item.basePoints}点返し
        </Text>
        <Text style={styles.rulesetDetail}>
          ウマ: {item.uma.join('/')} | オカ: {item.oka}
        </Text>
      </View>

      {item.memo && (
        <Text style={styles.rulesetMemo}>{item.memo}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ルール</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <>
            <Text style={[styles.selectorText, !selectedRuleset && styles.placeholderText]}>
              {selectedRuleset
                ? rulesetService.formatRulesetForDisplay(selectedRuleset)
                : 'ルールを選択してください'
              }
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {gameMode === 'four' ? '4人麻雀' : '3人麻雀'}のルール選択
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>ルールセットを読み込み中...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRulesets}
              keyExtractor={(item) => item.rulesetId}
              renderItem={renderRulesetItem}
              style={styles.rulesetList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
      <AlertComponent />
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
    marginBottom: 8,
  },
  selector: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  rulesetList: {
    flex: 1,
    padding: 16,
  },
  rulesetItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedRulesetItem: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f8ff',
  },
  rulesetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rulesetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  globalBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  globalBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  rulesetDetails: {
    marginBottom: 4,
  },
  rulesetDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  rulesetMemo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default RuleSelector;