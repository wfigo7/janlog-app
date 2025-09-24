#!/bin/bash

# 開発環境起動ヘルパースクリプト
# Makefileから呼び出される

set -e  # エラーが発生したら停止

# 共通関数を読み込み
source "$(dirname "$0")/common.sh"

# 引数チェック
if [ $# -eq 0 ]; then
    echo -e "${RED}エラー: 起動対象を指定してください${NC}"
    echo "使用方法: $0 <db|backend|frontend>"
    exit 1
fi

TARGET=$1

# DB起動
start_db() {
    echo -e "${BLUE}=== DynamoDB Local起動 ===${NC}"
    echo -e "${YELLOW}🗄️  DynamoDB Localを起動中...${NC}"
    docker-compose up -d dynamodb-local dynamodb-admin
    sleep 2
    echo -e "${GREEN}✓ DynamoDB Local起動完了${NC}"
    echo -e "${GREEN}🗄️  管理画面: http://localhost:8001${NC}"
    echo -e "${GREEN}📡 エンドポイント: http://localhost:8000${NC}"
}

# バックエンド起動
start_backend() {
    echo -e "${BLUE}=== バックエンドサーバー起動 ===${NC}"
    
    check_directory "backend" || return 1
    
    cd backend
    
    # 仮想環境をアクティベート
    activate_venv || return 1
    
    echo -e "${YELLOW}🚀 バックエンドサーバーを起動中...${NC}"
    export JANLOG_ENV=local
    echo -e "${GREEN}✓ バックエンドサーバー起動完了${NC}"
    echo -e "${GREEN}🚀 API: http://localhost:8080${NC}"
    echo -e "${GREEN}📖 ドキュメント: http://localhost:8080/docs${NC}"
    echo ""
    echo -e "${YELLOW}停止するには Ctrl+C を押してください${NC}"
    
    # サーバー起動（フォアグラウンド）
    python run_local.py
}

# フロントエンド起動
start_frontend() {
    echo -e "${BLUE}=== フロントエンド起動 ===${NC}"
    
    check_directory "frontend" || return 1
    
    cd frontend
    
    check_node_dependencies
    
    echo -e "${YELLOW}📱 Expoサーバーを起動中...${NC}"
    echo -e "${GREEN}✓ フロントエンド起動完了${NC}"
    echo ""
    echo -e "${YELLOW}停止するには Ctrl+C を押してください${NC}"
    
    # Expo起動（フォアグラウンド）
    npm start
}

# メイン処理
case $TARGET in
    db)
        start_db
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    *)
        echo -e "${RED}エラー: 不明なターゲット '$TARGET'${NC}"
        echo "有効なターゲット: db, backend, frontend"
        exit 1
        ;;
esac