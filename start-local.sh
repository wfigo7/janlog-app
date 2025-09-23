#!/bin/bash
# Janlog Local環境起動スクリプト

echo "=== Janlog Local環境起動 ==="
echo

# DynamoDB Local起動
echo "🗄️  DynamoDB Localを起動中..."
docker-compose up -d dynamodb-local dynamodb-admin
sleep 3

# バックエンド起動（バックグラウンド）
echo "🚀 バックエンドサーバーを起動中..."
cd backend

# 仮想環境をアクティベート（クロスプラットフォーム対応）
if [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]] || [[ "$OS" == "Windows_NT" ]] || [ -f "venv/Scripts/activate" ]; then
    # Windows (Git Bash/MSYS2)
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

export JANLOG_ENV=local
python run_local.py &
BACKEND_PID=$!
cd ..

# フロントエンド起動準備
echo "📱 フロントエンドを起動中..."
cd frontend

echo
echo "=== 起動完了 ==="
echo "🗄️  DynamoDB Local: http://localhost:8001 (管理画面)"
echo "🚀 バックエンドAPI: http://localhost:8080"
echo "📖 API ドキュメント: http://localhost:8080/docs"
echo "📱 フロントエンド: Expo開発サーバーを起動してください"
echo
echo "停止するには Ctrl+C を押してください"

# フロントエンド起動
npm start

# クリーンアップ
echo "🧹 クリーンアップ中..."
kill $BACKEND_PID 2>/dev/null
docker-compose stop dynamodb-local dynamodb-admin