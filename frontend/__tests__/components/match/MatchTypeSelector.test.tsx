import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MatchTypeSelector from '../../../src/components/match/MatchTypeSelector';
import { MatchType } from '../../../src/types/match';

describe('MatchTypeSelector', () => {
  const mockOnTypeChange = jest.fn();

  beforeEach(() => {
    mockOnTypeChange.mockClear();
  });

  it('3つの対局種別ボタンが表示される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType={null}
        onTypeChange={mockOnTypeChange}
      />
    );

    expect(getByText('フリー')).toBeTruthy();
    expect(getByText('セット')).toBeTruthy();
    expect(getByText('競技')).toBeTruthy();
  });

  it('ラベルが表示される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType={null}
        onTypeChange={mockOnTypeChange}
      />
    );

    expect(getByText('対局種別（任意）')).toBeTruthy();
  });

  it('フリーボタンをタップすると変更イベントが発火される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType={null}
        onTypeChange={mockOnTypeChange}
      />
    );

    fireEvent.press(getByText('フリー'));
    expect(mockOnTypeChange).toHaveBeenCalledWith('free');
  });

  it('セットボタンをタップすると変更イベントが発火される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType={null}
        onTypeChange={mockOnTypeChange}
      />
    );

    fireEvent.press(getByText('セット'));
    expect(mockOnTypeChange).toHaveBeenCalledWith('set');
  });

  it('競技ボタンをタップすると変更イベントが発火される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType={null}
        onTypeChange={mockOnTypeChange}
      />
    );

    fireEvent.press(getByText('競技'));
    expect(mockOnTypeChange).toHaveBeenCalledWith('competition');
  });

  it('選択済みのボタンを再度タップすると選択解除される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType="free"
        onTypeChange={mockOnTypeChange}
      />
    );

    fireEvent.press(getByText('フリー'));
    expect(mockOnTypeChange).toHaveBeenCalledWith(null);
  });

  it('選択された種別がハイライトされる（free）', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType="free"
        onTypeChange={mockOnTypeChange}
      />
    );

    const selectedButton = getByText('フリー');
    expect(selectedButton).toBeTruthy();
  });

  it('選択された種別がハイライトされる（set）', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType="set"
        onTypeChange={mockOnTypeChange}
      />
    );

    const selectedButton = getByText('セット');
    expect(selectedButton).toBeTruthy();
  });

  it('選択された種別がハイライトされる（competition）', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType="competition"
        onTypeChange={mockOnTypeChange}
      />
    );

    const selectedButton = getByText('競技');
    expect(selectedButton).toBeTruthy();
  });

  it('未選択状態（null）で全てのボタンが未選択表示される', () => {
    const { getByText } = render(
      <MatchTypeSelector
        selectedType={null}
        onTypeChange={mockOnTypeChange}
      />
    );

    expect(getByText('フリー')).toBeTruthy();
    expect(getByText('セット')).toBeTruthy();
    expect(getByText('競技')).toBeTruthy();
  });
});
