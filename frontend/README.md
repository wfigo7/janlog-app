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
- **ナビゲーション**: React Navigation
- **状態管理**: React Hooks + Context API
- **認証**: AWS Amplify (Cognito)
- **テスト**: Jest + React Native Testing Library

## 開発環境セットアップ

### 前提条件

- Node.js 18+
- Expo CLI
- iOS Simulator (macOS) または Android Emulator

### インストール

```bash
# プロジェクトルートから
npm install

# または直接このディレクトリで
cd frontend
npm install
```

### 開発サーバー起動

```bash
# プロジェクトルートから
npm run dev:frontend

# または直接このディレクトリで
cd frontend
npx expo start
```

### テスト実行

```bash
# プロジェクトルートから
npm run test:frontend

# または直接このディレクトリで
cd frontend
npm test
```

## ディレクトリ構造

```
frontend/
├── src/
│   ├── components/     # 共通コンポーネント
│   ├── screens/        # 画面コンポーネント
│   ├── navigation/     # ナビゲーション設定
│   ├── services/       # API通信
│   ├── hooks/          # カスタムフック
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
├── assets/             # 画像・フォント等
└── __tests__/          # テストファイル
```

## ビルド・デプロイ

```bash
# Android APK ビルド
npx expo build:android

# iOS IPA ビルド
npx expo build:ios

# Expo Application Services (EAS) ビルド
npx eas build --platform all
```

## 環境設定

環境変数は `app.config.js` で管理されています。

## 関連ドキュメント

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)