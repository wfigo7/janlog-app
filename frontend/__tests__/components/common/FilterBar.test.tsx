/**
 * FilterBar コンポーネントのテスト
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterBar } from '../../../src/components/common/FilterBar';

describe('FilterBar', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('フィルターボタンが表示される', () => {
    const { getByText } = render(
      <FilterBar
        value={{}}
        onChange={mockOnChange}
        gameMode="four"
      />
    );

    expect(getByText('フィルター')).toBeTruthy();
  });

  it('フィルターが設定されていない場合、バッジが表示されない', () => {
    const { queryByText } = render(
      <FilterBar
        value={{}}
        onChange={mockOnChange}
        gameMode="four"
      />
    );

    // バッジのテキストは数字なので、特定の数字が表示されていないことを確認
    expect(queryByText('1')).toBeNull();
    expect(queryByText('2')).toBeNull();
    expect(queryByText('3')).toBeNull();
  });

  it('対局種別フィルタが表示される', () => {
    const { getByText } = render(
      <FilterBar
        value={{}}
        onChange={mockOnChange}
        gameMode="four"
        showMatchTypeFilter={true}
      />
    );

    fireEvent.press(getByText('フィルター'));
    
    // 対局種別セクションのタイトルが表示されることを確認
    expect(getByText('対局種別')).toBeTruthy();
  });

  it('会場フィルタが表示される', () => {
    const { getByText } = render(
      <FilterBar
        value={{}}
        onChange={mockOnChange}
        gameMode="four"
        showVenueFilter={true}
      />
    );

    fireEvent.press(getByText('フィルター'));
    
    // 会場セクションのタイトルが表示されることを確認
    expect(getByText('会場')).toBeTruthy();
  });

  it('ルールフィルタが表示される', () => {
    const { getByText } = render(
      <FilterBar
        value={{}}
        onChange={mockOnChange}
        gameMode="four"
        showRulesetFilter={true}
      />
    );

    fireEvent.press(getByText('フィルター'));
    
    // ルールセクションのタイトルが表示されることを確認
    expect(getByText('ルール')).toBeTruthy();
  });

  it('期間フィルタが表示される', () => {
    const { getByText } = render(
      <FilterBar
        value={{}}
        onChange={mockOnChange}
        gameMode="four"
      />
    );

    fireEvent.press(getByText('フィルター'));
    
    // 期間セクションのタイトルが表示されることを確認
    expect(getByText('期間')).toBeTruthy();
  });
});
