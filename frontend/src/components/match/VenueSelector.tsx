import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { venueService } from '../../services/venueService';

interface Venue {
  venueId: string;
  venueName: string;
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface VenueSelectorProps {
  value?: string; // 選択された会場名
  onValueChange: (venueName: string | undefined) => void;
  placeholder?: string;
  style?: any;
}

export const VenueSelector: React.FC<VenueSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "会場を選択...",
  style,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewVenueInput, setShowNewVenueInput] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');

  // 会場一覧を取得
  const loadVenues = async () => {
    setIsLoading(true);
    try {
      const venueList = await venueService.getVenues();
      setVenues(venueList);
    } catch (error) {
      console.error('会場一覧取得エラー:', error);
      Alert.alert('エラー', '会場一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // モーダルを開く時に会場一覧を取得
  const openModal = () => {
    setIsModalVisible(true);
    loadVenues();
  };

  // 既存会場を選択
  const selectVenue = (venue: Venue) => {
    onValueChange(venue.venueName);
    setIsModalVisible(false);
    setShowNewVenueInput(false);
    setNewVenueName('');
  };

  // 新規会場入力を開始
  const startNewVenueInput = () => {
    setShowNewVenueInput(true);
  };

  // 新規会場入力をキャンセル
  const cancelNewVenueInput = () => {
    setShowNewVenueInput(false);
    setNewVenueName('');
  };

  // 新規会場名を確定
  const confirmNewVenue = () => {
    const trimmedName = newVenueName.trim();
    if (trimmedName) {
      onValueChange(trimmedName);
      setIsModalVisible(false);
      setShowNewVenueInput(false);
      setNewVenueName('');
    } else {
      Alert.alert('エラー', '会場名を入力してください');
    }
  };

  // 選択をクリア
  const clearSelection = () => {
    onValueChange(undefined);
  };

  // 既存会場のリストアイテム
  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.venueItem}
      onPress={() => selectVenue(item)}
    >
      <View style={styles.venueItemContent}>
        <Text style={styles.venueName}>{item.venueName}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>会場</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={openModal}
      >
        <Text style={[
          styles.selectorText,
          !value && styles.placeholderText
        ]}>
          {value || placeholder}
        </Text>
        <View style={styles.selectorIcons}>
          {value && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSelection}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setIsModalVisible(false);
                setShowNewVenueInput(false);
                setNewVenueName('');
              }}
            >
              <Text style={styles.modalCloseText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>会場を選択</Text>
            <View style={styles.modalCloseButton} />
          </View>

          {showNewVenueInput ? (
            // 新規会場入力画面
            <View style={styles.newVenueContainer}>
              <Text style={styles.newVenueLabel}>新しい会場名を入力</Text>
              <TextInput
                style={styles.newVenueInput}
                value={newVenueName}
                onChangeText={setNewVenueName}
                placeholder="例：雀荘A、友人宅"
                placeholderTextColor="#999"
                autoFocus
              />
              <View style={styles.newVenueButtons}>
                <TouchableOpacity
                  style={[styles.newVenueButton, styles.cancelButton]}
                  onPress={cancelNewVenueInput}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.newVenueButton, styles.confirmButton]}
                  onPress={confirmNewVenue}
                >
                  <Text style={styles.confirmButtonText}>確定</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // 会場選択画面
            <View style={styles.venueListContainer}>
              {venues.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>既存の会場</Text>
                  <FlatList
                    data={venues}
                    renderItem={renderVenueItem}
                    keyExtractor={(item) => item.venueId}
                    style={styles.venueList}
                  />
                </>
              )}
              
              <TouchableOpacity
                style={styles.newVenueOption}
                onPress={startNewVenueInput}
              >
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.newVenueOptionText}>新しい会場を入力...</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
    marginBottom: 8,
    color: '#333',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  selectorIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseButton: {
    width: 80,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  venueListContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  venueList: {
    flex: 1,
    marginBottom: 16,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  venueItemContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  newVenueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  newVenueOptionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  newVenueContainer: {
    flex: 1,
    padding: 16,
  },
  newVenueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  newVenueInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  newVenueButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newVenueButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});