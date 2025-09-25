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

- Node.js 22+
- Python 3.12+
- AWS CLI
- Expo CLI
- Docker & Docker Compose
- git

### 推奨ツール

- **direnv** (オプション) - 自動環境変数管理
  - ディレクトリ移動時に自動で環境変数を読み込み
  - インストール方法:
    - Windows: `choco install direnv`
    - Mac: `brew install direnv`
    - Linux/手動: `curl -sfL https://direnv.net/install.sh | bash`
  - 設定: `echo 'eval "$(direnv hook bash)"' >> ~/.bashrc`

### クイックスタート

#### 詳細なセットアップ手順

各コンポーネントの詳細な設定については、以下を参照してください：

- **バックエンド**: [backend/README.md](./backend/README.md)
- **フロントエンド**: [frontend/README.md](./frontend/README.md)  
- **インフラ**: [infra/README.md](./infra/README.md)
```


```bash
# 1. 依存関係のインストール
make setup # 未実装のため各コンポーネントの詳細なセットアップ手順を参照してください

# 2. ローカル開発環境の起動
make start

# 3. DB初期化
make db-create-tables

# 4. 開発環境確認
make check
```

**注意**: 統合セットアップ機能は未実装です。詳細な手動セットアップ手順は各コンポーネントのREADME.mdを参照してください。

### direnvを使用した開発（推奨）

direnvをインストールしている場合、ディレクトリ移動時に自動で環境変数が読み込まれます：

```bash
# プロジェクトルートで
direnv allow

# 各ディレクトリで初回のみ許可
cd backend && direnv allow
cd frontend && direnv allow

# 以降、ディレクトリ移動時に自動で環境変数が読み込まれます
cd backend  # → 自動で.env.localが読み込まれる
cd frontend # → 自動で.env.localが読み込まれる
```

**注意**: direnvはvenvの自動有効化は行いません。Pythonの仮想環境は手動で有効化してください：
```bash
cd backend
source venv/Scripts/activate  # Windows
# または
source venv/bin/activate      # Linux/Mac
```

## 開発コマンド

開発に必要な全てのコマンドはMakefileで統一されています。

```bash
# コマンド一覧を確認
make help

# 開発環境起動
make start

# テスト実行
make test

# 開発環境確認
make check

# 生成物とキャッシュの削除
make clean
```

**詳細な開発コマンドガイド**: [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

### デプロイ

未整備

## ライセンス

MIT
