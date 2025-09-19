# Janlog - Personal Mahjong Score Management App

Janlogは、フリー雀荘やセット麻雀の成績を個人用に記録・集計するモバイルアプリです。

## 概要

- 3人麻雀・4人麻雀の対局記録
- 複数の入力方式（順位+最終スコア、順位+素点、仮スコア）
- 成績統計表示（対局数、平均順位、トップ率、ラス率等）
- 招待制ユーザー認証
- ルールマスタ管理（ウマ・オカ設定）

## 技術スタック

- **フロントエンド**: React Native (Expo)
- **バックエンド**: FastAPI on AWS Lambda
- **データベース**: Amazon DynamoDB
- **認証**: Amazon Cognito
- **インフラ**: AWS CDK
- **CI/CD**: GitHub Actions

## プロジェクト構成

```
/
├── frontend/       # React Native Expo アプリ
├── backend/        # FastAPI Lambda アプリケーション
├── infra/          # AWS CDK インフラコード
├── shared/         # 共通型定義とユーティリティ
├── spec/           # API仕様書と設計ドキュメント
└── .kiro/          # Kiro AI設定
```

### 各ディレクトリの詳細

- **[frontend/](frontend/README.md)** - React Native (Expo) モバイルアプリケーション
- **[backend/](backend/README.md)** - FastAPI バックエンドAPI（Lambda + DynamoDB）
- **[infra/](infra/README.md)** - AWS CDK インフラストラクチャ定義
- **[shared/](shared/README.md)** - 共通型定義とユーティリティライブラリ
- **[spec/](spec/)** - OpenAPI仕様書とアーキテクチャドキュメント

## 開発ガイドライン

### UI/UX規約

このプロジェクトでは、一貫したユーザー体験のため以下の規約を設けています：

- **Alert.alert禁止**: React Native標準の`Alert.alert`は使用せず、カスタムアラートコンポーネントを使用
- **詳細**: [frontend/docs/UI_GUIDELINES.md](frontend/docs/UI_GUIDELINES.md) を参照

## 開発環境セットアップ

### 前提条件

- Node.js 18+
- Python 3.11+
- AWS CLI
- Expo CLI

### インストール

```bash
# Node.js依存関係のインストール（frontend, infra, shared）
npm install
npm install --workspaces

# Python依存関係のインストール（backend）
cd backend
pip install -r requirements.txt -r requirements-dev.txt
cd ..

# フロントエンド開発サーバー起動
npm run dev:frontend

# バックエンド開発サーバー起動
npm run dev:backend
```

### テスト実行

```bash
# 全体テスト実行
npm test

# 個別テスト実行
npm run test:frontend
npm run test:backend
npm run test:infra
npm run test:shared
```

### デプロイ

```bash
# インフラデプロイ
npm run deploy:infra
```

## ライセンス

MIT
