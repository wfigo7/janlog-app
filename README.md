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

```bash
# 1. 依存関係のインストール
make setup  # または以下を個別実行

# Frontend
cd frontend && npm install && cp .env.sample .env.local

# Backend  
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.sample .env.local

# Infrastructure
cd infra && npm install

# 2. ローカル開発環境の起動
make start-local  # または以下を個別実行
docker-compose up -d  # DynamoDB Local
cd backend && python scripts/generate_mock_jwt.py  # JWT生成
# 生成されたJWTを .env.local に設定
cd backend && python run_local.py  # バックエンド起動
cd frontend && npm run start:local  # フロントエンド起動
```

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

### 詳細なセットアップ手順

各コンポーネントの詳細な設定については、以下を参照してください：

- **バックエンド**: [backend/README.md](./backend/README.md)
- **フロントエンド**: [frontend/README.md](./frontend/README.md)  
- **インフラ**: [infra/README.md](./infra/README.md)
```

### テスト実行

```bash
# 全体テスト実行
./test.sh 

# 個別テスト実行
./test.sh frontend
./test.sh backend
./test.sh infra
```

### デプロイ

未整備

## ライセンス

MIT
