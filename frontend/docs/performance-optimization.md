# フロントエンドパフォーマンス最適化ガイド

## 概要

このドキュメントでは、Janlogフロントエンドアプリケーションのパフォーマンス最適化手法について説明します。

## 実装推奨項目

### 1. React.memoの活用

#### 対象コンポーネント

**StatsCard（統計カード）**
- 頻繁に再レンダリングされる可能性が高い
- 値が変わらない場合は再レンダリング不要

**実装例:**
```typescript
// components/stats/StatsCard.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export const StatsCard = memo<StatsCardProps>(
  ({ title, value, icon, color = '#4CAF50' }) => {
    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // カスタム比較関数（値が変わらない場合は再レンダリングしない）
    return (
      prevProps.value === nextProps.value &&
      prevProps.title === nextProps.title &&
      prevProps.icon === nextProps.icon &&
      prevProps.color === nextProps.color
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**MatchListItem（対局一覧アイテム）**
- 大量のアイテムがリスト表示される
- 個別アイテムの再レンダリングを最小化

**実装例:**
```typescript
// components/history/MatchListItem.tsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MatchListItemProps {
  match: {
    matchId: string;
    date: string;
    gameMode: 'three' | 'four';
    rank: number;
    finalPoints: number;
    venueName?: string;
  };
  onPress: (matchId: string) => void;
}

export const MatchListItem = memo<MatchListItemProps>(
  ({ match, onPress }) => {
    const rankColor = match.rank === 1 ? '#FFD700' : match.rank === 2 ? '#C0C0C0' : '#CD7F32';
    
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onPress(match.matchId)}
      >
        <View style={styles.header}>
          <Text style={styles.date}>{new Date(match.date).toLocaleDateString('ja-JP')}</Text>
          <Text style={[styles.rank, { color: rankColor }]}>
            {match.rank}位
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.gameMode}>
            {match.gameMode === 'three' ? '3人麻雀' : '4人麻雀'}
          </Text>
          <Text style={[styles.points, { color: match.finalPoints >= 0 ? '#4CAF50' : '#F44336' }]}>
            {match.finalPoints >= 0 ? '+' : ''}{match.finalPoints.toFixed(1)}pt
          </Text>
        </View>
        {match.venueName && (
          <Text style={styles.venue}>📍 {match.venueName}</Text>
        )}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // matchIdが同じで、データが変わっていない場合は再レンダリングしない
    return prevProps.match.matchId === nextProps.match.matchId &&
           prevProps.match.finalPoints === nextProps.match.finalPoints &&
           prevProps.match.rank === nextProps.match.rank;
  }
);

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameMode: {
    fontSize: 14,
    color: '#666',
  },
  points: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  venue: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
```

### 2. データキャッシュの実装

#### ルールセットキャッシュ

**実装例:**
```typescript
// services/cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 60; // 1時間

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp }: CacheItem<T> = JSON.parse(cached);
      
      // キャッシュ期限チェック
      if (Date.now() - timestamp > CACHE_DURATION) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

// キャッシュキー定義
export const CACHE_KEYS = {
  RULESETS: 'rulesets_cache',
  VENUES: 'venues_cache',
  USER_INFO: 'user_info_cache',
};
```

**API呼び出しでの使用例:**
```typescript
// services/api.ts
import { CacheService, CACHE_KEYS } from './cache';

export const getRulesets = async (): Promise<Ruleset[]> => {
  // キャッシュチェック
  const cached = await CacheService.get<Ruleset[]>(CACHE_KEYS.RULESETS);
  if (cached) {
    console.log('Using cached rulesets');
    return cached;
  }

  // APIから取得
  console.log('Fetching rulesets from API');
  const response = await api.get('/api/v1/rulesets');
  const rulesets = response.data.data;

  // キャッシュに保存
  await CacheService.set(CACHE_KEYS.RULESETS, rulesets);

  return rulesets;
};

// ルールセット作成・更新時はキャッシュをクリア
export const createRuleset = async (ruleset: RulesetRequest): Promise<Ruleset> => {
  const response = await api.post('/api/v1/rulesets', ruleset);
  
  // キャッシュをクリア
  await CacheService.remove(CACHE_KEYS.RULESETS);
  
  return response.data.data;
};
```

### 3. FlatListの最適化

**実装例:**
```typescript
// components/history/MatchList.tsx
import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { MatchListItem } from './MatchListItem';

interface MatchListProps {
  matches: Match[];
  onMatchPress: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, onMatchPress }) => {
  // keyExtractor（パフォーマンス最適化）
  const keyExtractor = useCallback((item: Match) => item.matchId, []);

  // renderItem（パフォーマンス最適化）
  const renderItem = useCallback(
    ({ item }: { item: Match }) => (
      <MatchListItem match={item} onPress={onMatchPress} />
    ),
    [onMatchPress]
  );

  // getItemLayout（スクロールパフォーマンス最適化）
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 120, // アイテムの高さ（固定値）
      offset: 120 * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={matches}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={10} // 初期表示件数
      maxToRenderPerBatch={10} // バッチ処理件数
      windowSize={5} // 表示ウィンドウサイズ
      removeClippedSubviews={true} // オフスクリーンアイテムの削除
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>対局履歴がありません</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
```

### 4. useMemoとuseCallbackの活用

**実装例:**
```typescript
// components/stats/StatsScreen.tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react';

export const StatsScreen: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [gameMode, setGameMode] = useState<'three' | 'four'>('four');

  // 統計データの計算（useMemo）
  const calculatedStats = useMemo(() => {
    if (!stats) return null;

    return {
      avgRank: stats.avgRank.toFixed(2),
      topRate: (stats.topRate * 100).toFixed(1) + '%',
      lastRate: (stats.lastRate * 100).toFixed(1) + '%',
      totalPoints: stats.totalPoints >= 0 ? '+' + stats.totalPoints.toFixed(1) : stats.totalPoints.toFixed(1),
    };
  }, [stats]);

  // ゲームモード変更ハンドラ（useCallback）
  const handleGameModeChange = useCallback((mode: 'three' | 'four') => {
    setGameMode(mode);
    // API呼び出し等
  }, []);

  return (
    <View style={styles.container}>
      {/* コンポーネント実装 */}
    </View>
  );
};
```

## パフォーマンス測定

### React DevTools Profiler

```typescript
// App.tsx
import React, { Profiler } from 'react';

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

export default function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      {/* アプリケーションコンポーネント */}
    </Profiler>
  );
}
```

## ベストプラクティス

### 1. 不要な再レンダリングを防ぐ
- React.memoを適切に使用
- useCallbackでコールバック関数をメモ化
- useMemoで計算結果をメモ化

### 2. リストの最適化
- FlatListのパフォーマンス設定を活用
- getItemLayoutで固定高さを指定
- keyExtractorを適切に実装

### 3. データキャッシュ
- 頻繁に変更されないデータはキャッシュ
- キャッシュ期限を適切に設定
- 更新時はキャッシュをクリア

### 4. 画像の最適化
- 適切なサイズの画像を使用
- 画像のキャッシュを活用
- LazyLoadingを実装

## まとめ

フロントエンドのパフォーマンス最適化は、ユーザー体験に直結する重要な要素です。上記の手法を適切に組み合わせることで、スムーズで快適なアプリケーションを実現できます。

### 優先順位
1. **高**: React.memoの適用（即座に効果が出る）
2. **高**: FlatListの最適化（大量データ表示時に効果大）
3. **中**: データキャッシュの実装（API呼び出し削減）
4. **低**: useMemo/useCallbackの細かい最適化

### 次のステップ
1. StatsCardにReact.memoを適用
2. MatchListItemにReact.memoを適用
3. ルールセットキャッシュの実装
4. FlatListの最適化設定
5. パフォーマンス測定とボトルネック特定
