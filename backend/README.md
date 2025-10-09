# Janlog Backend

麻雀成績記録アプリのバックエンドAPI（FastAPI + DynamoDB）

## 開発環境セットアップ

> **Note**: 初回セットアップは[プロジェクトルートのREADME](../README.md)を参照してください。

### 前提条件

- Python 3.12+
- Docker & Docker Compose（DynamoDB Local用）
- 仮想環境が作成済み

### 個別開発時の起動手順

#### 通常の手順
```bash
# 1. 仮想環境の有効化
source venv/bin/activate  # Linux/Mac
# または
.\venv\Scripts\Activate.ps1  # Windows

# 2. 環境変数の確認
cat .env.local  # JWTトークンが設定されていることを確認

# 3. DynamoDB Localの起動（プロジェクトルートで）
cd .. && docker compose up -d dynamodb-local

# 4. テーブル作成（初回のみ）
python scripts/create_local_tables.py --with-sample-data

# 5. サーバー起動
python run_local.py
```

#### direnv使用時（推奨）
```bash
# 1. ディレクトリ移動（環境変数が自動読み込み）
cd backend  # → .env.localが自動読み込み

# 2. 仮想環境の有効化（手動）
source venv/Scripts/activate  # Windows
# または
source venv/bin/activate      # Linux/Mac

# 3. 以降は通常と同じ
python run_local.py
```

### 4. DynamoDBテーブル作成とデータ投入

#### 統合初期化（推奨）

テーブル作成とテストデータ投入を一括で実行：

```bash
# プロジェクトルートから
make db-init

# このディレクトリから（サブディレクトリからのmake実行対応）
cd backend
make db-init  # ルートから実行したのと同じ動作

# 直接Pythonスクリプトで実行
python scripts/db/init_db.py --environment local
```

#### 個別実行

必要に応じて個別のステップを実行：

```bash
# テーブル作成のみ
make db-create-tables
# または
python scripts/db/create_tables.py --environment local

# ユーザーseed投入のみ
make db-seed-users
# または
python scripts/db/seed_users.py --environment local

# ルールセットseed投入のみ
make db-seed-rulesets
# または
python scripts/db/seed_rulesets.py --environment local

# seedデータ投入のみ（テーブル作成をスキップ）
make db-seed
# または
python scripts/db/init_db.py --environment local --skip-tables
```

#### データクリアと削除（破壊的操作）

**注意**: これらのコマンドはデータを削除する破壊的操作です。

```bash
# テーブルデータのみクリア（テーブル構造は保持、local環境のみ）
make db-clear-data
# または
python scripts/db/create_tables.py --environment local --clear-data

# テーブル再作成（既存テーブルを削除して再作成、local環境のみ）
make db-recreate
# または
python scripts/db/create_tables.py --environment local --recreate

# DynamoDB Local完全削除（Docker環境破壊）
make db-destroy
```

**各コマンドの違い**:
- `db-clear-data`: テーブル内の全データを削除（テーブル構造は保持）
- `db-recreate`: テーブルを削除して再作成（データとテーブル構造の両方を削除）
- `db-destroy`: Docker Composeリソースを完全削除（コンテナ、ボリューム、ネットワーク）

#### テーブル確認

```bash
# テーブル一覧
AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy \
aws dynamodb list-tables --endpoint-url http://localhost:8000

# テーブル内容確認
AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy \
aws dynamodb scan --table-name janlog-table-local --endpoint-url http://localhost:8000
```

### 5. バックエンドサーバー起動

```bash
# プロジェクトルートから
make start-backend  # または make sb

# このディレクトリから（サブディレクトリからのmake実行対応）
cd backend
make start-backend  # ルートから実行したのと同じ動作
make sb             # 短縮形も使用可能

# 直接Pythonスクリプトで実行
python run_local.py
```

サーバーは http://localhost:8080 で起動します。

### 6. API動作確認

```bash
# プロジェクトルートから
make check

# このディレクトリから（サブディレクトリからのmake実行対応）
cd backend
make check  # ルートから実行したのと同じ動作

# 別ターミナルで手動テスト実行
python manual_tests/test_api.py
python manual_tests/match/test_match_api.py

# または直接curl
curl http://localhost:8080/health
curl http://localhost:8080/
```

### テスト実行

```bash
# プロジェクトルートから
make test-backend  # または make tb

# このディレクトリから（サブディレクトリからのmake実行対応）
cd backend
make test-backend  # ルートから実行したのと同じ動作
make tb            # 短縮形も使用可能

# 直接pytestで実行
pytest tests/ -v
```

### 📁 サブディレクトリからのmake実行対応

**このディレクトリからでもプロジェクトルートと同じmakeコマンドが使用可能です！**

```bash
cd backend

# バックエンドサーバー起動
make start-backend  # または make sb

# テスト実行
make test-backend   # または make tb

# DynamoDB関連
make start-db       # DynamoDB Local起動
make db-create-tables  # テーブル作成

# 全体のヘルプ表示
make help

# 環境確認
make check

# その他全てのmakeコマンドが使用可能
```

この機能により、バックエンド開発中にディレクトリを移動することなく、必要なコマンドを実行できます。

## 環境変数

ローカル開発用の環境変数は `.env.local` に定義されています：

```bash
ENVIRONMENT=development
DYNAMODB_TABLE_NAME=janlog-table
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
JWT_SECRET_KEY=development-secret-key-for-local-testing
```

## DynamoDBテーブル構造

### メインテーブル: `janlog-table`

- **PK (Partition Key)**: `USER#{userId}`
- **SK (Sort Key)**: `PROFILE` | `MATCH#{matchId}` | `RULESET#{rulesetId}`

### GSI1: 日付範囲クエリ用

- **GSI1PK**: `USER#{userId}#MATCH`
- **GSI1SK**: `{ISO8601_datetime}`

## API エンドポイント

- `GET /` - API情報
- `GET /health` - ヘルスチェック
- `GET /docs` - Swagger UI（開発環境のみ）

## 開発用スクリプト

### データベース管理スクリプト

テストデータ管理スクリプトは `scripts/db/` ディレクトリに整理されています：

#### 統合スクリプト
- `scripts/db/init_db.py` - データベース統合初期化（テーブル作成 + seedデータ投入）

#### 個別スクリプト
- `scripts/db/create_tables.py` - DynamoDBテーブル作成・削除・データクリア
- `scripts/db/seed_users.py` - ユーザーseedデータ投入
- `scripts/db/seed_rulesets.py` - ルールセットseedデータ投入

#### ユーティリティ
- `scripts/db/utils.py` - スクリプト共通ユーティリティ関数

### Seedデータファイル

テストデータは `seeds/` ディレクトリのYAMLファイルで管理されています：

- `seeds/users.yaml` - テストユーザーデータ
- `seeds/rulesets.yaml` - ルールセット定義（参照用ドキュメント）

### その他のスクリプト

- `scripts/generate_mock_jwt.py` - local環境用の静的JWT生成
- `run_local.py` - ローカル開発サーバー起動

## 手動テストスクリプト

手動テスト用のスクリプトは `manual_tests/` ディレクトリに整理されています：

### 基本APIテスト
- `manual_tests/test_api.py` - ヘルスチェック、ルートエンドポイント

### 対局記録APIテスト
- `manual_tests/match/test_match_api.py` - 対局CRUD操作の基本テスト
- `manual_tests/match/test_match_validation.py` - バリデーション機能テスト
- `manual_tests/match/test_match_crud.py` - 完全なCRUD操作テスト

詳細は `manual_tests/README.md` を参照してください。

## 環境別の実行例

### local環境（デフォルト）

```bash
# 統合初期化
python scripts/db/init_db.py --environment local

# テーブル再作成（既存テーブルを削除して再作成）
python scripts/db/create_tables.py --environment local --recreate

# テーブルデータのみクリア（テーブル構造は保持）
python scripts/db/create_tables.py --environment local --clear-data

# 既存ユーザーを上書き
python scripts/db/seed_users.py --environment local --force

# 既存ルールセットをクリーンアップしてから投入
python scripts/db/seed_rulesets.py --environment local --clean
```

### development環境

```bash
# テーブル作成をスキップしてseedデータのみ投入
python scripts/db/init_db.py --environment development --skip-tables

# ユーザーseed投入のみ
python scripts/db/seed_users.py --environment development

# ルールセットseed投入のみ
python scripts/db/seed_rulesets.py --environment development

# 既存ルールセットをクリーンアップしてから投入
python scripts/db/seed_rulesets.py --environment development --clean
```

**注意**: development環境ではテーブル削除・再作成は推奨されません（CDKで管理）。

## トラブルシューティング

### DynamoDB Localに接続できない

**症状**: `Connection refused` エラーが発生する

**解決方法**:
```bash
# Docker Composeログ確認
docker compose logs dynamodb-local

# コンテナ再起動
docker compose restart dynamodb-local

# DynamoDB Local起動
make start-db
```

### テーブルが見つからない

**症状**: `ResourceNotFoundException: Cannot do operations on a non-existent table`

**解決方法**:
```bash
# テーブル作成
make db-create-tables

# または統合初期化
make db-init
```

### YAMLファイル読み込みエラー

**症状**: `FileNotFoundError: seeds/users.yaml`

**解決方法**:
```bash
# backendディレクトリから実行していることを確認
cd backend
python scripts/db/seed_users.py --environment local

# または絶対パスで指定
python scripts/db/seed_users.py --environment local --file /path/to/seeds/users.yaml
```

### AWS認証エラー（development環境）

**症状**: `NoCredentialsError: Unable to locate credentials`

**解決方法**:
```bash
# AWS認証情報を確認
aws sts get-caller-identity

# AWS CLIの設定
aws configure

# または環境変数で指定
export AWS_PROFILE=your-profile
```

### テーブル削除の警告

**症状**: development環境でテーブル削除を試みると警告が表示される

**理由**: development環境のテーブルはCDKで管理されているため、削除は推奨されません。

**解決方法**:
```bash
# データのみクリアする場合
python scripts/db/create_tables.py --environment development --clear-data

# どうしても削除する場合（非推奨）
python scripts/db/create_tables.py --environment development --recreate --force
```

### ポート競合

デフォルトポート使用状況：
- DynamoDB Local: 8000
- FastAPI: 8080

ポートが使用中の場合は、`compose.yaml` や `run_local.py` で変更してください。

### 仮想環境が見つからない

**症状**: `venv/bin/activate: No such file or directory`

**解決方法**:
```bash
# 仮想環境を作成
python -m venv venv

# 依存関係をインストール
source venv/bin/activate  # Linux/Mac
# または
.\venv\Scripts\Activate.ps1  # Windows

pip install -r requirements.txt
```