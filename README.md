# Janlog - Personal Mahjong Score Management App

Janlogは、フリー雀荘やセット麻雀の成績を個人用に記録・集計するモバイルアプリです。

## 概要

- 3人麻雀・4人麻雀の対局記録
- 複数の入力方式（順位+最終ポイント、順位+素点、仮ポイント）
- 成績統計表示（対局数、平均順位、トップ率、ラス率等）
- 招待制ユーザー認証
- ルール管理機能
  - グローバルルール（管理者が作成、全ユーザーが利用可能）
  - 個人ルール（各ユーザーが自分用に作成）
  - ウマ・オカ設定の柔軟な管理
  - 浮きウマルール対応（日本プロ麻雀連盟などの競技麻雀ルール）

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

## バージョン管理

Janlogは[Semantic Versioning 2.0.0](https://semver.org/)に準拠したバージョン管理を採用しています。

- **現在のバージョン**: 0.1.0（初期MVPリリース）
- **バージョンフォーマット**: `MAJOR.MINOR.PATCH`
- **詳細なガイド**: [VERSIONING.md](VERSIONING.md)を参照

### サブシステムバージョン

- **フロントエンド**: 0.1.0（`frontend/package.json`）
- **バックエンド**: 0.1.0（`backend/pyproject.toml`）
- **インフラ**: 0.1.0（`infra/package.json`）

### バージョン確認方法

- **アプリ内**: プロフィール画面の「バージョン情報」セクション
- **API**: `GET /health`エンドポイントの`version`フィールド

## 開発ガイドライン

### UI/UX規約

このプロジェクトでは、一貫したユーザー体験のため以下の規約を設けています：

- **Alert.alert禁止**: React Native標準の`Alert.alert`は使用せず、カスタムアラートコンポーネントを使用
- **詳細**: [frontend/docs/UI_GUIDELINES.md](frontend/docs/UI_GUIDELINES.md) を参照

### 監視・ログ

本番環境でのトラブルシューティングのため、CloudWatch Logsを使用しています：

- **API Gatewayアクセスログ**: リクエスト/レスポンス、エラー情報
- **Cognito認証ログ**: ログイン成功/失敗、認証エラー
- **詳細**: [docs/monitoring-logs.md](docs/monitoring-logs.md) を参照

## CI/CD

このプロジェクトでは、GitHub Actionsを使用した継続的デプロイメント（CD）パイプラインを提供しています。

### GitHub Actionsによる自動デプロイ

GitHub Actionsのworkflow_dispatchを使用して、手動でデプロイを実行できます。

#### デプロイ方法

1. GitHubリポジトリの **Actions** タブに移動
2. **CD Pipeline** ワークフローを選択
3. **Run workflow** ボタンをクリック
4. デプロイオプションを選択：
   - **Deploy Backend**: バックエンド（Docker → ECR → Lambda）
   - **Deploy Infrastructure**: インフラストラクチャ（AWS CDK）
   - **Deploy Frontend Web**: フロントエンドWeb版（Expo Web → S3）
   - **Environment**: デプロイ環境（development）
5. **Run workflow** をクリックして実行

#### デプロイオプション

各コンポーネントは独立してデプロイ可能です：

- **Backend**: FastAPIアプリケーションをDockerイメージとしてビルドし、ECRにプッシュ、Lambda関数を更新
- **Infrastructure**: AWS CDKでインフラストラクチャをデプロイ（S3、Cognito、API Gateway、Lambda、ECR等）
- **Frontend Web**: Expo WebアプリをビルドしてS3にデプロイ、CloudFrontキャッシュを無効化

複数のコンポーネントを同時に選択して一括デプロイすることも可能です。

#### AWS認証の設定（OIDC）

CI/CDパイプラインは**OIDC（OpenID Connect）認証**を使用しています。これにより、長期的なアクセスキーを保存する必要がなく、セキュリティが向上します。

**初回セットアップ**:

1. CDKでOIDCスタックをデプロイ：
   ```bash
   cd infra
   npm run deploy -- --context environment=development JanlogGitHubOidcStack-development
   ```

2. デプロイ完了後、出力される`GitHubActionsRoleArn`を確認

3. GitHub Actionsワークフローは自動的にこのロールを使用します

**メリット**:
- アクセスキーの管理不要
- 一時的な認証情報のみ使用
- セキュリティリスクの低減
- CloudTrailでの追跡が容易

**詳細なガイド**: [CI/CDデプロイメントガイド](docs/ci-cd-guide.md)を参照してください。

### ローカルデプロイ

GitHub Actionsを使用せず、ローカルからデプロイすることも可能です。

## デプロイ

### Web版デプロイ

Expo Web版をCloudFront + S3で配信できます。

```bash
# development環境へのビルドとデプロイ
make web-build-deploy

# production環境へのビルドとデプロイ
make web-build-deploy-prod
```

詳細は [.kiro/steering/scripts.md](.kiro/steering/scripts.md#web版デプロイの詳細) を参照してください。

## ユーザー招待フロー

### 管理者による招待

1. **Cognito管理画面でユーザー作成**
   - User Pool: `janlog-user-pool-development`
   - "Send an email invitation"を選択
   - "Eメールアドレスを検証済みとしてマーク"にチェック
   - パスワードは自動生成を推奨

2. **招待メール送信**
   - Cognitoが自動的にカスタムテンプレートでメール送信
   - ユーザー名と一時パスワードが記載される

### ユーザーの初回ログイン

1. 招待メールを受信
2. アプリを起動してログイン
3. 一時パスワードでログイン
4. **新しいパスワードを設定**（初回のみ）
5. ログイン完了

### 環境別の動作

- **local環境**: 静的JWT認証（パスワード変更フローなし）
- **development環境**: Cognito認証（初回パスワード変更あり）
- **production環境**: Cognito認証（初回パスワード変更あり）

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
make setup # 未実装のため各コンポーネントの詳細なセットアップ手順を参照してください

# 2. ローカル開発環境の起動
make start

# 3. DB初期化
make db-create-tables

# 4. 開発環境確認
make check
```

#### 詳細なセットアップ手順

各コンポーネントの詳細な設定については、以下を参照してください：

- **バックエンド**: [backend/README.md](./backend/README.md)
- **フロントエンド**: [frontend/README.md](./frontend/README.md)  
- **インフラ**: [infra/README.md](./infra/README.md)

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

### 📁 サブディレクトリからのmake実行対応

*サブディレクトリからでも同じmakeコマンドが使用可能です！**

```bash
# フロントエンド開発中
cd frontend
make start-frontend  # ルートから実行したのと同じ動作
make tf              # フロントエンドテスト実行

# バックエンド開発中  
cd backend
make test-backend    # バックエンドテスト実行
make tb              # 短縮形も使用可能

# インフラ開発中
cd infra
make test-infra      # インフラテスト実行
make ti              # 短縮形も使用可能
```

**詳細な開発コマンドガイド**: [Makefile.md](./Makefile.md) を参照してください。

### デプロイ

未整備

## ライセンス

MIT
