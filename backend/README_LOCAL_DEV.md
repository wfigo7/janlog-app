# Janlog Backend - ローカル開発環境

## 概要

このドキュメントでは、Janlog バックエンドのローカル開発環境のセットアップと使用方法について説明します。

## 前提条件

- Docker & Docker Compose
- Python 3.9+
- AWS CLI（DynamoDB Local操作用、オプション）

## クイックスタート

### 1. 初回セットアップ

```bash
# プロジェクトルートで実行
make setup
```

このコマンドで以下が自動実行されます：
- Docker Compose起動（DynamoDB Local）
- Python仮想環境作成
- 依存関係インストール
- DynamoDBテーブル作成
- サンプルデータ投入

### 2. 開発サーバー起動

```bash
# バックエンドサーバー起動
make start-backend
```

サーバーが起動すると以下のエンドポイントが利用可能になります：
- API: http://localhost:8080
- ヘルスチェック: http://localhost:8080/health
- API ドキュメント: http://localhost:8080/docs

## 個別コマンド

### DynamoDB Local操作

```bash
# DynamoDB Local起動
make start-db

# DynamoDB Local停止
make stop-db

# テーブル作成（サンプルデータ付き）
make create-tables
```

### 開発

```bash
# バックエンドサーバー起動
make start-backend

# テスト実行
make test-backend

# 環境確認
make check
```

### クリーンアップ

```bash
# Docker環境クリーンアップ
make clean
```

## 手動セットアップ（詳細）

### 1. DynamoDB Local起動

```bash
docker-compose up -d dynamodb-local
```

### 2. Python環境セットアップ

```bash
cd backend

# 仮想環境作成
python3 -m venv venv
source venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt
```

### 3. 環境変数設定

```bash
# .env.localファイルを確認・編集
cat .env.local

# 環境変数を読み込み
export $(cat .env.local | grep -v '^#' | xargs)
```

### 4. テーブル作成

```bash
# テーブル作成（サンプルデータ付き）
python scripts/create_local_tables.py --with-sample-data

# テーブル作成のみ
python scripts/create_local_tables.py
```

### 5. サーバー起動

```bash
python run_local.py
```

## 環境変数

ローカル開発環境では `.env.local` ファイルで環境変数を管理します：

```bash
# 環境設定
ENVIRONMENT=development

# DynamoDB設定
DYNAMODB_TABLE_NAME=janlog-table
DYNAMODB_ENDPOINT_URL=http://localhost:8000
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy

# JWT設定（開発用）
JWT_SECRET_KEY=development-secret-key-for-local-testing
```

## DynamoDB Local操作

### AWS CLIでの操作

```bash
# テーブル一覧
aws dynamodb list-tables --endpoint-url http://localhost:8000

# テーブル詳細
aws dynamodb describe-table --table-name janlog-table --endpoint-url http://localhost:8000

# アイテム取得
aws dynamodb get-item \
  --table-name janlog-table \
  --key '{"PK":{"S":"USER#test-user-1"},"SK":{"S":"PROFILE"}}' \
  --endpoint-url http://localhost:8000

# アイテム一覧（スキャン）
aws dynamodb scan --table-name janlog-table --endpoint-url http://localhost:8000
```

### Pythonスクリプトでの操作

```python
import boto3

# DynamoDB Local接続
dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url='http://localhost:8000',
    region_name='ap-northeast-1',
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy'
)

table = dynamodb.Table('janlog-table')

# アイテム取得
response = table.get_item(
    Key={'PK': 'USER#test-user-1', 'SK': 'PROFILE'}
)
print(response.get('Item'))
```

## トラブルシューティング

### DynamoDB Localに接続できない

```bash
# Docker コンテナ状態確認
docker-compose ps

# DynamoDB Local ログ確認
docker-compose logs dynamodb-local

# ポート確認
netstat -an | grep 8000
```

### テーブルが作成されない

```bash
# 手動でテーブル作成スクリプト実行
cd backend
export $(cat .env.local | grep -v '^#' | xargs)
python scripts/create_local_tables.py --with-sample-data
```

### バックエンドサーバーが起動しない

```bash
# 依存関係再インストール
cd backend
source venv/bin/activate
pip install -r requirements.txt

# 環境変数確認
echo $DYNAMODB_ENDPOINT_URL
echo $DYNAMODB_TABLE_NAME
```

## サンプルデータ

初回セットアップ時に以下のサンプルデータが作成されます：

- **テストユーザー**: `test-user-1`
- **デフォルトルールセット**: 4人麻雀・3人麻雀
- **サンプル対局データ**: 1件

これらのデータを使用してAPI動作確認やフロントエンド開発を行えます。

## 次のステップ

1. **API動作確認**: http://localhost:8080/docs でSwagger UIを確認
2. **フロントエンド開発**: React NativeアプリからローカルAPIに接続
3. **テスト実行**: `make test-backend` でバックエンドテストを実行