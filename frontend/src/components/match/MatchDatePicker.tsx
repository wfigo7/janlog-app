/**
 * 対局日選択コンポーネント
 * 要件10.1-10.7に対応した日付選択機能を提供
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface MatchDatePickerProps {
  value: string; // ISO 8601形式の日付文字列
  onChange: (date: string) => void;
  error?: string | null;
}

export const MatchDatePicker: React.FC<MatchDatePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);


  const [selectedDate, setSelectedDate] = useState(() => {
    // valueが空の場合は現在日付をデフォルトに設定
    return value ? new Date(value) : new Date();
  });

  // 日付の制限を計算
  const today = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);

  // 日付バリデーション関数
  const validateDate = (date: Date): { isValid: boolean; message?: string } => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // 今日の終わりまで許可

    // 未来の日付チェック
    if (date > now) {
      return { isValid: false, message: '未来の日付は選択できません' };
    }

    // 5年以上前の日付チェック
    if (date < fiveYearsAgo) {
      return { isValid: false, message: '5年以上前の日付は選択できません' };
    }

    return { isValid: true };
  };

  // 日付を表示用フォーマットに変換
  const formatDisplayDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  // 日付をISO 8601形式（時刻00:00:00付き）に変換
  const formatISODate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00+09:00`;
  };

  // 日付選択時の処理
  const handleDateChange = (event: any, date?: Date) => {
    // Android・Webでは常にピッカーを閉じる
    if (Platform.OS === 'android' || Platform.OS === 'web') {
      setShowPicker(false);
    }

    // dateがundefinedの場合（キャンセル時）は何もしない
    if (date) {
      const validation = validateDate(date);
      if (validation.isValid) {
        setSelectedDate(date);
        const isoDate = formatISODate(date);
        onChange(isoDate);
      } else {
        // バリデーションエラーの場合、エラーメッセージを親コンポーネントに通知
        console.warn('日付バリデーションエラー:', validation.message);
      }
    }
  };

  // ピッカーを開く
  const openPicker = () => {
    setShowPicker(true);
  };

  // ピッカーを閉じる（iOS用）
  const closePicker = () => {
    setShowPicker(false);
  };

  // 現在の値から表示用の日付を取得
  const getDisplayDate = (): string => {
    if (value) {
      try {
        const date = new Date(value);
        return formatDisplayDate(date);
      } catch (error) {
        console.error('日付パースエラー:', error);
        return formatDisplayDate(new Date());
      }
    }
    return formatDisplayDate(new Date());
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.picker,
          error && styles.pickerError
        ]}
        onPress={openPicker}
        testID="match-date-picker-button"
      >
        <Text style={styles.pickerText}>
          {getDisplayDate()}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666666" />
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Android用のDateTimePicker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={today}
          minimumDate={fiveYearsAgo}
        />
      )}

      {/* Web用の日付選択 */}
      {Platform.OS === 'web' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.cancelButton}>キャンセル</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>対局日を選択</Text>
                <TouchableOpacity onPress={() => {
                  // 現在選択されている日付で確定
                  const isoDate = formatISODate(selectedDate);
                  onChange(isoDate);
                  closePicker();
                }}>
                  <Text style={styles.doneButton}>完了</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.webDatePickerContainer}>
                <Text style={styles.webDatePickerLabel}>日付を選択してください</Text>
                <View style={styles.webDateDisplay}>
                  <Text style={styles.webDateText}>
                    {formatDisplayDate(selectedDate)}
                  </Text>
                </View>
                <View style={styles.webDateControls}>
                  <TouchableOpacity
                    style={styles.webDateButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      if (newDate >= fiveYearsAgo) {
                        setSelectedDate(newDate);
                      }
                    }}
                  >
                    <Text style={styles.webDateButtonText}>前日</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.webDateButton}
                    onPress={() => {
                      setSelectedDate(new Date());
                    }}
                  >
                    <Text style={styles.webDateButtonText}>今日</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.webDateButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      if (newDate <= today) {
                        setSelectedDate(newDate);
                      }
                    }}
                  >
                    <Text style={styles.webDateButtonText}>翌日</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* iOS用のModal + DateTimePicker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={closePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.cancelButton}>キャンセル</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>対局日を選択</Text>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.doneButton}>完了</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={today}
                minimumDate={fiveYearsAgo}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 44,
  },
  pickerError: {
    borderColor: '#f44336',
    borderWidth: 2,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  doneButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  iosDatePicker: {
    height: 200,
  },
  webDatePickerContainer: {
    padding: 20,
  },
  webDatePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  webDateDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  webDateText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  webDateControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  webDateButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
  webDateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MatchDatePicker;