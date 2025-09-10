#!/bin/bash
# ローカル開発環境セットアップスクリプト

set -e

echo "=== Janlog ローカル開発環境セットアップ ==="

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# Docker Composeでサービス起動
echo "1. Docker Composeサービス起動中..."
docker-compose up -d

# DynamoDB Localの起動待機
echo "2. DynamoDB Localの起動を待機中..."
sleep 5

# 接続確認
echo "3. DynamoDB Local接続確認..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        echo "✅ DynamoDB Localに接続できました"
        break
    else
        echo "⏳ DynamoDB Local起動待機中... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ DynamoDB Localに接続できませんでした"
    echo "Docker Composeログを確認してください: docker-compose logs dynamodb-local"
    exit 1
fi

# 環境変数読み込み
echo "4. 環境変数設定..."
export $(cat backend/.env.local | grep -v '^#' | xargs)

# Pythonの依存関係インストール
echo "5. Python依存関係インストール..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# テーブル作成
echo "6. DynamoDBテーブル作成..."
python scripts/create_local_tables.py --with-sample-data

echo ""
echo "✅ セットアップ完了!"
echo ""
echo "次のステップ:"
echo "1. バックエンド起動:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   source .env.local && python run_local.py"
echo ""
echo "2. API確認:"
echo "   curl http://localhost:8080/health"
echo ""
echo "3. DynamoDB確認:"
echo "   aws dynamodb list-tables --endpoint-url http://localhost:8000"
echo ""
echo "4. Docker停止:"
echo "   docker-compose down"