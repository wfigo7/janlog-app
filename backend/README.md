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
cd .. && docker-compose up -d dynamodb-local

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

### 4. DynamoDBテーブル作成

```bash
# テーブル作成（サンプルデータ付き）
python scripts/create_local_tables.py --with-sample-data

# テーブル確認（AWS CLI使用）
AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy \
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### 4. バックエンドサーバー起動

```bash
# ローカル開発サーバー起動
python run_local.py
```

サーバーは http://localhost:8080 で起動します。

### 5. API動作確認

```bash
# 別ターミナルで手動テスト実行
python manual_tests/test_api.py
python manual_tests/match/test_match_api.py

# または直接curl
curl http://localhost:8080/health
curl http://localhost:8080/
```

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

- `scripts/create_local_tables.py` - DynamoDBテーブル作成
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

## トラブルシューティング

### DynamoDB Localに接続できない

```bash
# Docker Composeログ確認
docker-compose logs dynamodb-local

# コンテナ再起動
docker-compose restart dynamodb-local
```

### テーブルが見つからない

```bash
# テーブル再作成
python scripts/create_local_tables.py --with-sample-data
```

### ポート競合

デフォルトポート使用状況：
- DynamoDB Local: 8000
- FastAPI: 8080

ポートが使用中の場合は、`docker-compose.yml` や `run_local.py` で変更してください。