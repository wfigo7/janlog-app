/**
 * 期間選択コンポーネント
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DateRange {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = '期間を選択',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const getDisplayText = () => {
    if (!value.from && !value.to) {
      return placeholder;
    }

    if (value.from && value.to) {
      return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }

    if (value.from) {
      return `${formatDate(value.from)} -`;
    }

    if (value.to) {
      return `- ${formatDate(value.to)}`;
    }

    return placeholder;
  };

  const presetRanges = [
    {
      label: '今月',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      },
    },
    {
      label: '先月',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      },
    },
    {
      label: '過去3ヶ月',
      getValue: () => {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          from: threeMonthsAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0],
        };
      },
    },
    {
      label: '過去6ヶ月',
      getValue: () => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return {
          from: sixMonthsAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0],
        };
      },
    },
    {
      label: '今年',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0],
        };
      },
    },
  ];

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    const range = preset.getValue();
    onChange(range);
    setModalVisible(false);
  };

  const handleClear = () => {
    onChange({});
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setModalVisible(true)}
        testID="date-range-picker-button"
      >
        <Text style={[
          styles.pickerText,
          (!value.from && !value.to) && styles.placeholderText
        ]}>
          {getDisplayText()}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} testID="modal-title">期間を選択</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.presetContainer}>
              {presetRanges.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetButton}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <Text style={styles.presetButtonText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>クリア</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 44,
  },
  pickerText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  placeholderText: {
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  presetContainer: {
    padding: 20,
  },
  presetButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  presetButtonText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});