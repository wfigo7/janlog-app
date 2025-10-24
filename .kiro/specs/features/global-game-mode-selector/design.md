# Design Document

## Overview

本設計では、アプリ全体で共有されるグローバルなゲームモード選択機能を実装します。現在、各画面で独立して管理されているゲームモード状態を、React Contextを使用したグローバル状態管理に移行し、ヘッダー右側に配置されたコンパクトなUIで切り替えられるようにします。

### 主要な設計決定

1. **グローバル状態管理**: React Context APIを使用してゲームモード状態をアプリ全体で共有
2. **永続化**: AsyncStorageを使用してゲームモード選択を永続化
3. **ヘッダー統合**: Expo Routerの`headerRight`オプションを使用してヘッダー右側にUI配置
4. **画面別表示制御**: 画面名に基づいて切り替えUIの表示/非表示を制御
5. **既存コンポーネント削除**: 各画面のGameModeTabコンポーネントを削除し、グローバル状態を参照

## Architecture

### コンポーネント構成

```
App
├── GameModeProvider (Context Provider)
│   └── Tab Navigation
│       ├── Stats Screen (統計)
│       │   └── Header with GameModeSelector
│       ├── History Screen (履歴)
│       │   └── Header with GameModeSelector
│       ├── Register Screen (登録)
│       │   └── Header with GameModeSelector
│       ├── Rules Screen (ルール管理)
│       │   └── Header with GameModeSelector
│       └── Profile Screen (プロフィール)
│           └── Header without GameModeSelector
```

### データフロー

```
User Action (ヘッダーのGameModeSelector)
    ↓
GameModeContext.setGameMode()
    ↓
AsyncStorage.setItem() (永続化)
    ↓
Context State Update
    ↓
各画面のuseGameMode()フックが新しい値を受け取る
    ↓
useEffect()でデータ再取得・フォーム初期化
```

## Components and Interfaces

### 1. GameModeContext

**ファイル**: `frontend/src/contexts/GameModeContext.tsx`

```typescript
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

export const GameModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameMode, setGameModeState] = useState<GameMode>(DEFAULT_GAME_MODE);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にAsyncStorageから読み込み
  useEffect(() => {
    loadGameMode();
  }, []);

  const loadGameMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(GAME_MODE_STORAGE_KEY);
      if (stored === 'three' || stored === 'four') {
        setGameModeState(stored);
      }
    } catch (error) {
      console.error('Failed to load game mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setGameMode = async (mode: GameMode) => {
    try {
      await AsyncStorage.setItem(GAME_MODE_STORAGE_KEY, mode);
      setGameModeState(mode);
    } catch (error) {
      console.error('Failed to save game mode:', error);
      throw error;
    }
  };

  return (
    <GameModeContext.Provider value={{ gameMode, setGameMode, isLoading }}>
      {children}
    </GameModeContext.Provider>
  );
};

export const useGameMode = (): GameModeContextType => {
  const context = useContext(GameModeContext);
  if (!context) {
    throw new Error('useGameMode must be used within GameModeProvider');
  }
  return context;
};
```

### 2. HeaderGameModeSelector

**ファイル**: `frontend/src/components/common/HeaderGameModeSelector.tsx`

ヘッダー右側に配置されるコンパクトなゲームモード切り替えUI。

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameMode } from '../../contexts/GameModeContext';
import { GameMode } from '../../types/common';

export const HeaderGameModeSelector: React.FC = () => {
  const { gameMode, setGameMode } = useGameMode();

  const handleToggle = async () => {
    const newMode: GameMode = gameMode === 'four' ? 'three' : 'four';
    try {
      await setGameMode(newMode);
    } catch (error) {
      console.error('Failed to change game mode:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={styles.modeContainer}>
        <Text style={[
          styles.modeText,
          gameMode === 'four' && styles.activeMode
        ]}>
          4麻
        </Text>
        <View style={styles.separator} />
        <Text style={[
          styles.modeText,
          gameMode === 'three' && styles.activeMode
        ]}>
          3麻
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    paddingHorizontal: 6,
  },
  activeMode: {
    color: '#007AFF',
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: '#CCCCCC',
  },
});
```

### 3. Tab Layout更新

**ファイル**: `frontend/app/(tabs)/_layout.tsx`

各タブ画面のヘッダーにGameModeSelectorを条件付きで表示。

```typescript
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { HeaderGameModeSelector } from '@/src/components/common/HeaderGameModeSelector';

export default function TabLayout() {
  // ゲームモード切り替えを表示する画面
  const screensWithGameMode = ['index', 'history', 'register', 'rules'];

  const getHeaderRight = (routeName: string) => {
    if (screensWithGameMode.includes(routeName)) {
      return () => <HeaderGameModeSelector />;
    }
    return undefined;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '成績統計',
          tabBarLabel: '統計',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          headerRight: getHeaderRight('index'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '対局履歴',
          tabBarLabel: '履歴',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
          headerRight: getHeaderRight('history'),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: '対局登録',
          tabBarLabel: '登録',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
          headerRight: getHeaderRight('register'),
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'ルール管理',
          tabBarLabel: 'ルール',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          headerRight: getHeaderRight('rules'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarLabel: 'プロフィール',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          // プロフィール画面にはheaderRightを設定しない
        }}
      />
    </Tabs>
  );
}
```

## Data Models

### GameMode型

既存の型定義を使用（変更なし）。

```typescript
// frontend/src/types/common.ts
export type GameMode = 'three' | 'four';
```

### AsyncStorage Key

```typescript
const GAME_MODE_STORAGE_KEY = '@janlog:gameMode';
```

## Error Handling

### AsyncStorage エラー

- **読み込み失敗**: デフォルト値（'four'）を使用し、エラーログを出力
- **書き込み失敗**: エラーをthrowし、呼び出し元でハンドリング（UI上でエラー表示は行わない）

### Context未初期化エラー

- `useGameMode()`をProvider外で使用した場合、明確なエラーメッセージをthrow

## Testing Strategy

### 単体テスト

1. **GameModeContext**
   - 初期値が'four'であること
   - AsyncStorageから値を正しく読み込むこと
   - setGameMode()で値が更新され、AsyncStorageに保存されること
   - AsyncStorageエラー時にデフォルト値を使用すること

2. **HeaderGameModeSelector**
   - 現在のゲームモードが視覚的に強調表示されること
   - タップでゲームモードが切り替わること
   - 切り替え失敗時にエラーログが出力されること

### 統合テスト

1. **画面間の状態共有**
   - 統計画面でゲームモードを切り替え、履歴画面に移動しても状態が保持されること
   - アプリ再起動後も選択したゲームモードが復元されること

2. **データ再取得**
   - 統計画面でゲームモード切り替え時にデータが再取得されること
   - 履歴画面でゲームモード切り替え時にデータが再取得されること
   - ルール管理画面でゲームモード切り替え時にルール一覧がフィルタリングされること

3. **フォーム初期化**
   - 対局登録画面でゲームモード切り替え時にフォームが初期化されること
   - ルールセット選択がクリアされること

## Implementation Details

### 各画面の修正内容

#### 1. StatsScreen（統計画面）

**変更点**:
- `useState<GameMode>`を削除
- `useGameMode()`フックを使用
- `GameModeTab`コンポーネントを削除
- `useEffect`でgameModeの変更を監視してデータ再取得

```typescript
// Before
const [selectedMode, setSelectedMode] = useState<GameMode>('four');

// After
const { gameMode } = useGameMode();

useEffect(() => {
  loadData();
}, [gameMode, filters]); // gameModeを依存配列に追加
```

#### 2. HistoryScreen（履歴画面）

**変更点**:
- `useState<GameMode>`を削除
- `useGameMode()`フックを使用
- `GameModeTab`コンポーネントを削除
- `useEffect`でgameModeの変更を監視してデータ再取得

```typescript
// Before
const [selectedMode, setSelectedMode] = useState<GameMode>('four');

// After
const { gameMode } = useGameMode();

useEffect(() => {
  fetchMatches();
}, [gameMode, filters]); // gameModeを依存配列に追加
```

#### 3. MatchRegistrationScreen（対局登録画面）

**変更点**:
- `useMatchForm`フックでグローバルなgameModeを参照
- `GameModeTab`コンポーネントを削除
- ゲームモード切り替え時にフォームを初期化

```typescript
// useMatchForm.ts内
const { gameMode } = useGameMode();

useEffect(() => {
  // ゲームモード変更時にフォームを初期化
  setFormData(prev => ({
    ...prev,
    gameMode: gameMode,
    selectedRuleset: null,
    rank: '',
    finalPoints: '',
    rawScore: '',
  }));
  clearCalculations();
}, [gameMode]);
```

#### 4. RulesScreen（ルール管理画面）

**変更点**:
- `useGameMode()`フックを使用
- ゲームモードに基づいてルール一覧をフィルタリング
- グローバルルールと個人ルールの両方をフィルタリング

```typescript
const { gameMode } = useGameMode();

useEffect(() => {
  fetchRules();
}, [gameMode]); // gameModeを依存配列に追加

// フィルタリング処理
const filteredGlobalRules = globalRules.filter(r => r.gameMode === gameMode);
const filteredPersonalRules = personalRules.filter(r => r.gameMode === gameMode);
```

### App.tsx（またはルートレイアウト）の修正

GameModeProviderでアプリ全体をラップ。

```typescript
// frontend/app/_layout.tsx
import { GameModeProvider } from '@/src/contexts/GameModeContext';

export default function RootLayout() {
  return (
    <GameModeProvider>
      {/* 既存のプロバイダーとナビゲーション */}
    </GameModeProvider>
  );
}
```

### 削除するコンポーネント

以下のコンポーネントは使用されなくなるため削除を検討（または非推奨化）:

- `frontend/src/components/common/GameModeTab.tsx` - 各画面で使用されていたタブUI

ただし、他の画面や将来的な用途で使用される可能性があるため、完全削除ではなくコメントで非推奨化を推奨。

## Migration Strategy

### 段階的な移行

1. **Phase 1**: GameModeContextとHeaderGameModeSelectorの実装
2. **Phase 2**: Tab Layoutの更新（ヘッダーにSelectorを追加）
3. **Phase 3**: 各画面の修正（統計、履歴、登録、ルール管理）
4. **Phase 4**: 既存のGameModeTabコンポーネントの削除
5. **Phase 5**: テストと動作確認

### 互換性の維持

- 既存のGameMode型定義は変更しない
- 各画面のAPIコール部分は変更しない（gameModeパラメータの取得元のみ変更）

## Performance Considerations

### 最適化ポイント

1. **Context更新の最小化**: gameModeの変更時のみContextを更新
2. **AsyncStorage操作の非同期化**: UI操作をブロックしない
3. **useEffect依存配列の適切な設定**: 不要な再レンダリングを防ぐ

### パフォーマンス影響

- **Context Provider**: アプリ全体で1つのみ、オーバーヘッドは最小限
- **AsyncStorage**: 読み込みは初回のみ、書き込みは切り替え時のみ
- **ヘッダーコンポーネント**: 軽量なUI、レンダリングコストは低い

## Accessibility

- **タッチターゲットサイズ**: ヘッダーのSelectorは最小44x44pxを確保
- **視覚的フィードバック**: activeOpacityで押下時のフィードバック
- **色のコントラスト**: アクティブ状態は#007AFF、非アクティブは#999999で明確に区別

## Future Enhancements

1. **アニメーション**: ゲームモード切り替え時のスムーズなトランジション
2. **ハプティックフィードバック**: 切り替え時の触覚フィードバック
3. **A/Bテスト**: ヘッダー配置 vs 画面内配置の効果測定
4. **ショートカット**: 長押しで直接選択できるメニュー表示
