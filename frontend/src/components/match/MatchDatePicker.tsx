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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface MatchDatePickerProps {
  value: string; // ISO 8601形式の日付文字列
  onChange: (date: string) => void;
  error?: string | null;
}

interface WebCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
}

// Web用カレンダーコンポーネント
const WebCalendar: React.FC<WebCalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  // 月の日数を取得
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 月の最初の日の曜日を取得（0=日曜日）
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 日付が選択可能かチェック
  const isDateSelectable = (date: Date): boolean => {
    return date >= minDate && date <= maxDate;
  };

  // 日付が選択されているかチェック
  const isDateSelected = (date: Date): boolean => {
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  // 今日かどうかチェック
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 翌月に移動
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // 前月の空白セル
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(date);
    }

    // 6週間（42セル）になるまで空白セルを追加
    while (days.length < 42) {
      days.push(null);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthYear = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  return (
    <View style={styles.calendar}>
      {/* カレンダーヘッダー */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
          <Text style={styles.calendarNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.calendarTitle}>{monthYear}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
          <Text style={styles.calendarNavText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 曜日ヘッダー */}
      <View style={styles.calendarWeekHeader}>
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
        ))}
      </View>

      {/* カレンダーグリッド */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.calendarDay,
                  !date && styles.calendarDayEmpty,
                  date && !isDateSelectable(date) && styles.calendarDayDisabled,
                  date && isDateSelected(date) && styles.calendarDaySelected,
                  date && isToday(date) && !isDateSelected(date) && styles.calendarDayToday,
                ]}
                onPress={() => date && isDateSelectable(date) && onDateSelect(date)}
                disabled={!date || !isDateSelectable(date)}
              >
                <Text style={[
                  styles.calendarDayText,
                  date && !isDateSelectable(date) && styles.calendarDayTextDisabled,
                  date && isDateSelected(date) && styles.calendarDayTextSelected,
                  date && isToday(date) && !isDateSelected(date) && styles.calendarDayTextToday,
                ]}>
                  {date ? date.getDate() : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export const MatchDatePicker: React.FC<MatchDatePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // ISO日付文字列を安全にパースする関数
  const parseISODate = (isoString: string): Date => {
    // ISO文字列から年月日を抽出（タイムゾーンに依存しない）
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Dateオブジェクトでは月は0ベース
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    // valueが空の場合は現在日付をデフォルトに設定
    return value ? parseISODate(value) : new Date();
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
        const date = parseISODate(value);
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
              <ScrollView style={styles.webDatePickerContainer}>
                <Text style={styles.webDatePickerLabel}>日付を選択してください</Text>
                <View style={styles.webDateDisplay}>
                  <Text style={styles.webDateText}>
                    {formatDisplayDate(selectedDate)}
                  </Text>
                </View>
                
                {/* クイック選択ボタン（上部に移動） */}
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
                
                {/* カレンダー表示（下部に移動） */}
                <WebCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  minDate={fiveYearsAgo}
                  maxDate={today}
                />
              </ScrollView>
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

const styles = StyleSheet.create<any>({
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
    maxHeight: 600,
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
  // カレンダースタイル
  calendar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  calendarNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    paddingVertical: 4,
  },
  calendarGrid: {
    gap: 1,
  },
  calendarWeek: {
    flexDirection: 'row',
    gap: 1,
  },
  calendarDay: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDayDisabled: {
    backgroundColor: '#e9ecef',
  },
  calendarDaySelected: {
    backgroundColor: '#2196F3',
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextDisabled: {
    color: '#adb5bd',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#856404',
    fontWeight: '500',
  },
});

export default MatchDatePicker;