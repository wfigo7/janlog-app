# Janlog Frontend

React Native (Expo) モバイルアプリケーション

## 概要

Janlogのフロントエンドは、React Native + Expoを使用したクロスプラットフォーム（iOS/Android）モバイルアプリです。

## 主要機能

- 対局記録の入力・管理
- 成績統計の表示
- ユーザー認証（Cognito）
- ルール設定管理

## 技術スタック

- **フレームワーク**: React Native + Expo
- **言語**: TypeScript
- **ナビゲーション**: Expo Router (ファイルベースルーティング)
- **状態管理**: React Hooks + Context API
- **認証**: AWS Amplify (Cognito)
- **テスト**: Jest + Expo Testing Library

## 開発環境セットアップ

> **Note**: 初回セットアップは[プロジェクトルートのREADME](../README.md)を参照してください。

### 前提条件

- Node.js 22+
- Expo CLI
- iOS Simulator (macOS) または Android Emulator
- バックエンドサーバーが起動済み

### 個別開発時の起動手順

#### 通常の手順
```bash
# 1. 環境変数の確認
cat .env.local  # JWTトークンが設定されていることを確認

# 2. 開発サーバー起動
npm run start:local  # ローカル環境用

# 3. アプリの確認
# - Web: http://localhost:8081
# - モバイル: QRコードをスキャン
```

#### direnv使用時（推奨）
```bash
# 1. ディレクトリ移動（環境変数が自動読み込み）
cd frontend  # → .env.localが自動読み込み

# 2. 開発サーバー起動
npm run start:local

# 3. アプリの確認
# - Web: http://localhost:8081
# - モバイル: QRコードをスキャン
```

### 開発サーバー起動

```bash
# プロジェクトルートから
make start-frontend  # または make sf

# このディレクトリから（サブディレクトリからのmake実行対応）
cd frontend
make start-frontend  # ルートから実行したのと同じ動作
make sf              # 短縮形も使用可能

# 直接npmコマンドで実行
npm start

# 特定のプラットフォームで起動
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

### テスト実行

```bash
# プロジェクトルートから
make test-frontend  # または make tf

# このディレクトリから（サブディレクトリからのmake実行対応）
cd frontend
make test-frontend  # ルートから実行したのと同じ動作
make tf             # 短縮形も使用可能

# 直接npmコマンドで実行
npm test
```

### 📁 サブディレクトリからのmake実行対応

**このディレクトリからでもプロジェクトルートと同じmakeコマンドが使用可能です！**

```bash
cd frontend

# 開発サーバー起動
make start-frontend  # または make sf

# テスト実行
make test-frontend   # または make tf

# 全体のヘルプ表示
make help

# 環境確認
make check

# その他全てのmakeコマンドが使用可能
```

この機能により、フロントエンド開発中にディレクトリを移動することなく、必要なコマンドを実行できます。

## ディレクトリ構造

```
frontend/
├── app/                # Expo Router ページ
│   ├── (tabs)/        # タブナビゲーション
│   │   ├── index.tsx  # 統計画面
│   │   ├── history.tsx # 履歴画面
│   │   └── register.tsx # 対局登録画面
│   └── _layout.tsx    # ルートレイアウト
├── src/
│   ├── components/     # 画面コンポーネント
│   │   ├── stats/     # 統計関連
│   │   ├── history/   # 履歴関連
│   │   └── match/     # 対局登録関連
│   ├── services/       # API通信
│   ├── hooks/          # カスタムフック
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
├── assets/             # 画像・フォント等
├── components/         # Expo共通コンポーネント
├── constants/          # 定数定義
└── hooks/              # Expo共通フック
```

## ビルド・デプロイ

```bash
# Expo Application Services (EAS) ビルド
npm run build:android  # Android
npm run build:ios      # iOS
npm run build          # 全プラットフォーム

# 開発ビルド
npx expo run:android   # Android
npx expo run:ios       # iOS
```

## 環境設定

環境変数は `app.config.js` で管理されています。

## 開発ガイドライン

### UI/UXガイドライン

**重要**: このプロジェクトでは、React Native標準の`Alert.alert`は使用しません。

```typescript
// ❌ 使用禁止
import { Alert } from 'react-native';
Alert.alert('タイトル', 'メッセージ');

// ✅ 推奨
import { useCustomAlert } from '../hooks/useCustomAlert';

function MyComponent() {
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const handleAction = () => {
    showAlert({
      title: 'タイトル',
      message: 'メッセージ',
    });
  };

  return (
    <View>
      {/* コンポーネント内容 */}
      <AlertComponent />
    </View>
  );
}
```

詳細は [`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md) を参照してください。

### コーディング規約

- TypeScriptの型定義を必須とする
- ESLintルールに従う
- コンポーネントは関数コンポーネントを使用
- カスタムフックでロジックを分離
- テストコードを併せて作成

## 関連ドキュメント

- [UI/UXガイドライン](./docs/UI_GUIDELINES.md)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)