/**
 * ゲームモードコンテキスト
 * アプリ全体で共有されるゲームモード状態を管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types/common';

interface GameModeContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => Promise<void>;
  isLoading: boolean;
}

const GameModeContext = createContext<GameModeContextType | undefined>(undefined);

const GAME_MODE_STORAGE_KEY = '@janlog:gameMode';
const DEFAULT_GAME_MODE: GameMode = 'four';

interface GameModeProviderProps {
  children: ReactNode;
}

export const GameModeProvider: React.FC<GameModeProviderProps> = ({ children }) => {
  const [gameMode, setGameModeState] = useState<GameMode>(DEFAULT_GAME_MODE);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にAsyncStorageから読み込み
  useEffect(() => {
    loadGameMode();
  }, []);

  /**
   * AsyncStorageからゲームモードを読み込む
   */
  const loadGameMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(GAME_MODE_STORAGE_KEY);
      if (stored === 'three' || stored === 'four') {
        setGameModeState(stored);
      }
    } catch (error) {
      console.error('Failed to load game mode:', error);
      // エラー時はデフォルト値を使用
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ゲームモードを設定し、AsyncStorageに保存
   */
  const setGameMode = async (mode: GameMode) => {
    try {
      await AsyncStorage.setItem(GAME_MODE_STORAGE_KEY, mode);
      setGameModeState(mode);
    } catch (error) {
      console.error('Failed to save game mode:', error);
      throw error;
    }
  };

  const value: GameModeContextType = {
    gameMode,
    setGameMode,
    isLoading,
  };

  return (
    <GameModeContext.Provider value={value}>
      {children}
    </GameModeContext.Provider>
  );
};

/**
 * ゲームモードコンテキストを使用するカスタムフック
 */
export const useGameMode = (): GameModeContextType => {
  const context = useContext(GameModeContext);
  if (!context) {
    throw new Error('useGameMode must be used within GameModeProvider');
  }
  return context;
};
