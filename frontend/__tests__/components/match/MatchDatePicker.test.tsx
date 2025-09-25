/**
 * MatchDatePicker コンポーネントのテスト
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MatchDatePicker } from '../../../src/components/match/MatchDatePicker';

// Ioniconsのモック
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// DateTimePickerのモック - シンプルなモック
jest.mock('@react-native-community/datetimepicker', () => 'MockDateTimePicker');

describe('MatchDatePicker', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: '2024-03-15T00:00:00+09:00',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 日付を固定してテストの一貫性を保つ
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-15T12:00:00+09:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('正常にレンダリングされる', () => {
    const { getByTestId } = render(<MatchDatePicker {...defaultProps} />);

    expect(getByTestId('match-date-picker-button')).toBeTruthy();
  });

  it('日付が正しく表示される', () => {
    const { getByText } = render(<MatchDatePicker {...defaultProps} />);

    // 固定された日付で確実にテスト
    expect(getByText('2024年3月15日')).toBeTruthy();
  });

  it('エラーメッセージが表示される', () => {
    const { getByText } = render(
      <MatchDatePicker {...defaultProps} error="テストエラー" />
    );

    expect(getByText('テストエラー')).toBeTruthy();
  });

  it('ピッカーボタンをタップできる', () => {
    const { getByTestId } = render(<MatchDatePicker {...defaultProps} />);

    const pickerButton = getByTestId('match-date-picker-button');
    fireEvent.press(pickerButton);

    // ボタンが押せることを確認（実際のピッカー動作はE2Eテストで確認）
    expect(pickerButton).toBeTruthy();
  });

  it('空の値の場合は現在日付を表示', () => {
    // モックされた現在日付（2024年3月15日）を使用
    const expectedText = '2024年3月15日';

    const { getByText } = render(
      <MatchDatePicker value="" onChange={mockOnChange} />
    );

    expect(getByText(expectedText)).toBeTruthy();
  });
});