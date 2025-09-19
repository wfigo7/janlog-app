/**
 * DateRangePicker コンポーネントのテスト
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateRangePicker } from '../../../src/components/common/DateRangePicker';

describe('DateRangePicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('プレースホルダーテキストを表示する', () => {
    const { getByText } = render(
      <DateRangePicker
        value={{}}
        onChange={mockOnChange}
        placeholder="期間を選択してください"
      />
    );

    expect(getByText('期間を選択してください')).toBeTruthy();
  });

  it('日付範囲が設定されている場合、フォーマットされた日付を表示する', () => {
    const { getByText } = render(
      <DateRangePicker
        value={{
          from: '2024-01-01',
          to: '2024-01-31',
        }}
        onChange={mockOnChange}
      />
    );

    expect(getByText('2024/01/01 - 2024/01/31')).toBeTruthy();
  });

  it('開始日のみ設定されている場合、適切に表示する', () => {
    const { getByText } = render(
      <DateRangePicker
        value={{
          from: '2024-01-01',
        }}
        onChange={mockOnChange}
      />
    );

    expect(getByText('2024/01/01 -')).toBeTruthy();
  });

  it('終了日のみ設定されている場合、適切に表示する', () => {
    const { getByText } = render(
      <DateRangePicker
        value={{
          to: '2024-01-31',
        }}
        onChange={mockOnChange}
      />
    );

    expect(getByText('- 2024/01/31')).toBeTruthy();
  });

  it('ピッカーをタップするとモーダルが開く', () => {
    const { getByTestId } = render(
      <DateRangePicker
        value={{}}
        onChange={mockOnChange}
        placeholder="期間を選択"
      />
    );

    // ピッカーをタップ
    fireEvent.press(getByTestId('date-range-picker-button'));
    
    // モーダルが開いたことを確認
    expect(getByTestId('modal-title')).toBeTruthy();
  });
});