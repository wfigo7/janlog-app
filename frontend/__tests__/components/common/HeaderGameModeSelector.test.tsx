/**
 * HeaderGameModeSelector コンポーネントのテスト
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HeaderGameModeSelector } from '../../../src/components/common/HeaderGameModeSelector';
import { GameModeProvider } from '../../../src/contexts/GameModeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorageのモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Animated APIのモック
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn(),
  });
  return RN;
});

describe('HeaderGameModeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <GameModeProvider>
        {component}
      </GameModeProvider>
    );
  };

  it('初期状態で4人麻雀と3人麻雀のテキストを表示する', async () => {
    const { getByText } = renderWithProvider(<HeaderGameModeSelector />);

    await waitFor(() => {
      expect(getByText('4人麻雀')).toBeTruthy();
      expect(getByText('3人麻雀')).toBeTruthy();
    });
  });

  it('デフォルトで4人麻雀が選択されている', async () => {
    const { getByText } = renderWithProvider(<HeaderGameModeSelector />);

    await waitFor(() => {
      const fourModeText = getByText('4人麻雀');
      const threeModeText = getByText('3人麻雀');
      
      // 4人麻雀が選択状態（activeText）
      expect(fourModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '800', opacity: 1 })
      );
      
      // 3人麻雀が非選択状態（通常のsegmentText）
      expect(threeModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '500', opacity: 0.7 })
      );
    });
  });

  it('3人麻雀をタップするとゲームモードが切り替わる', async () => {
    const { getByText } = renderWithProvider(<HeaderGameModeSelector />);

    await waitFor(() => {
      expect(getByText('3人麻雀')).toBeTruthy();
    });

    // 3人麻雀をタップ
    fireEvent.press(getByText('3人麻雀'));

    // AsyncStorageに保存されることを確認
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@janlog:gameMode',
        'three'
      );
    });

    // 切り替え後の状態を確認
    await waitFor(() => {
      const threeModeText = getByText('3人麻雀');
      const fourModeText = getByText('4人麻雀');
      
      // 3人麻雀が選択状態になる
      expect(threeModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '800', opacity: 1 })
      );
      
      // 4人麻雀が非選択状態になる
      expect(fourModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '500', opacity: 0.7 })
      );
    });
  });

  it('4人麻雀をタップするとゲームモードが切り替わる', async () => {
    // 初期状態を3人麻雀に設定
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('three');

    const { getByText } = renderWithProvider(<HeaderGameModeSelector />);

    await waitFor(() => {
      expect(getByText('4人麻雀')).toBeTruthy();
    });

    // 4人麻雀をタップ
    fireEvent.press(getByText('4人麻雀'));

    // AsyncStorageに保存されることを確認
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@janlog:gameMode',
        'four'
      );
    });

    // 切り替え後の状態を確認
    await waitFor(() => {
      const fourModeText = getByText('4人麻雀');
      const threeModeText = getByText('3人麻雀');
      
      // 4人麻雀が選択状態になる
      expect(fourModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '800', opacity: 1 })
      );
      
      // 3人麻雀が非選択状態になる
      expect(threeModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '500', opacity: 0.7 })
      );
    });
  });

  it('同じモードを再度タップしても変更されない', async () => {
    const { getByText } = renderWithProvider(<HeaderGameModeSelector />);

    await waitFor(() => {
      expect(getByText('4人麻雀')).toBeTruthy();
    });

    // 既に選択されている4人麻雀をタップ
    fireEvent.press(getByText('4人麻雀'));

    // AsyncStorageが呼ばれないことを確認
    await waitFor(() => {
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  it('AsyncStorageから保存された値を復元する', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('three');

    const { getByText } = renderWithProvider(<HeaderGameModeSelector />);

    await waitFor(() => {
      const threeModeText = getByText('3人麻雀');
      const fourModeText = getByText('4人麻雀');
      
      // 3人麻雀が選択状態（activeText）
      expect(threeModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '800', opacity: 1 })
      );
      
      // 4人麻雀が非選択状態（通常のsegmentText）
      expect(fourModeText.props.style).toContainEqual(
        expect.objectContaining({ fontWeight: '500', opacity: 0.7 })
      );
    });
  });
});
