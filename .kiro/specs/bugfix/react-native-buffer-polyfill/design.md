# Design Document

## Overview

React Native環境でNode.jsの`buffer`モジュールpolyfillを設定し、`react-native-svg`（`react-native-chart-kit`の依存関係）が正常に動作するようにします。この問題は、React Native環境ではNode.jsの標準モジュールが利用できないため、適切なpolyfillとMetro bundler設定が必要なことが原因です。

## Architecture

### 問題の根本原因
1. `react-native-chart-kit` → `react-native-svg` → `buffer`モジュールの依存関係
2. React Native環境ではNode.jsの`buffer`モジュールが利用できない
3. Metro bundlerがモジュール解決時にエラーを発生

### 解決アプローチ
1. **Buffer Polyfill**: `buffer`パッケージをインストールしてpolyfillを提供
2. **Metro設定**: Metro bundlerでpolyfillを適用するよう設定
3. **Babel設定**: 必要に応じてBabel transformを追加

## Components and Interfaces

### 1. Package Dependencies
```json
{
  "dependencies": {
    "buffer": "^6.0.3"
  }
}
```

### 2. Metro Configuration
新しい`metro.config.js`ファイルを作成：
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Node.js polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

// Ensure buffer is included in the bundle
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
```

### 3. Global Polyfill Setup
アプリのエントリーポイントでpolyfillを設定：
```javascript
// App.tsx または index.js の最上部
import { Buffer } from 'buffer';
global.Buffer = Buffer;
```

## Data Models

### Configuration Files Structure
```
frontend/
├── metro.config.js          # Metro bundler設定
├── babel.config.js          # 既存のBabel設定（変更なし）
├── package.json             # buffer依存関係追加
└── App.tsx                  # グローバルpolyfill設定
```

## Error Handling

### 1. Build Time Errors
- Metro bundlerでのモジュール解決エラー
- 適切なalias設定で解決

### 2. Runtime Errors
- `Buffer is not defined`エラー
- グローバルpolyfill設定で解決

### 3. Platform Compatibility
- iOS/Android両プラットフォームでの動作確認
- Web版での互換性確保

## Testing Strategy

### 1. Build Testing
- EAS Build（Android/iOS）での成功確認
- ローカルExpo開発サーバーでの動作確認

### 2. Functionality Testing
- `react-native-chart-kit`を使用するStatsChart コンポーネントの動作確認
- SVG描画機能の正常動作確認

### 3. Cross-Platform Testing
- Android実機/エミュレーターでのテスト
- iOS実機/シミュレーターでのテスト
- Expo Go/Development Buildでのテスト

## Implementation Steps

### Phase 1: Polyfill Setup
1. `buffer`パッケージをインストール
2. `metro.config.js`を作成してalias設定
3. グローバルpolyfillを設定

### Phase 2: Build Verification
1. ローカル開発サーバーでの動作確認
2. EAS Buildでのビルド成功確認
3. 既存機能の回帰テスト

### Phase 3: Documentation
1. BUILD.mdの更新
2. トラブルシューティングガイドの追加

## Alternative Solutions Considered

### 1. react-native-svg代替ライブラリ
- **却下理由**: `react-native-chart-kit`が`react-native-svg`に強く依存
- **影響**: チャート機能の大幅な書き換えが必要

### 2. react-native-chart-kit代替ライブラリ
- **却下理由**: 既存のStatsChart実装との互換性
- **影響**: UI/UXの変更が必要

### 3. カスタムチャート実装
- **却下理由**: 開発コストが高い
- **影響**: 機能実装の遅延

## Security Considerations

- `buffer`パッケージは信頼できるNode.jsコアモジュールのpolyfill
- セキュリティリスクは最小限
- 定期的な依存関係更新で脆弱性対応

## Performance Considerations

- Bundle sizeの微増（buffer polyfillによる）
- Runtime performanceへの影響は最小限
- 必要な場合のみpolyfillを読み込む設計