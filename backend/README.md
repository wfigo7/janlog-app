# Janlog Backend

麻雀成績記録アプリのバックエンドAPI（FastAPI + DynamoDB）

## ローカル開発環境セットアップ

### 前提条件

- Python 3.12+
- Docker & Docker Compose
- AWS CLI（テーブル確認用、オプション）

### 1. DynamoDB Localの起動

```bash
# プロジェクトルートで実行
docker-compose up -d

# 起動確認
docker-compose ps
```

### 2. Python環境のセットアップ

```bash
cd backend

# 仮想環境作成（初回のみ）
python3 -m venv venv

# 仮想環境有効化
source venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt
```

### 3. DynamoDBテーブル作成

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
# 別ターミナルでテスト実行
python test_api.py

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
- `test_api.py` - API動作確認テスト

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