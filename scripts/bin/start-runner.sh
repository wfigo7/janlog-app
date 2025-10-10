#!/bin/bash

# 開発環境起動ヘルパースクリプト
# Makefileから呼び出される

set -e  # エラーが発生したら停止

# 共通関数を読み込み
source "$(dirname "$0")/common.sh"

# 引数チェック
if [ $# -eq 0 ]; then
    echo -e "${RED}エラー: 起動対象を指定してください${NC}"
    echo "使用方法: $0 <db-start|db-stop|backend|frontend>"
    exit 1
fi

TARGET=$1

# DB起動
start_db() {
    echo -e "${BLUE}=== DynamoDB Local起動 ===${NC}"
    echo -e "${YELLOW}🗄️  DynamoDB Localを起動中...${NC}"
    
    if docker compose up -d dynamodb-local dynamodb-admin; then
        sleep 2
        echo -e "${GREEN}✓ DynamoDB Local起動完了${NC}"
        echo -e "${GREEN}🗄️  管理画面: http://localhost:8001${NC}"
        echo -e "${GREEN}📡 エンドポイント: http://localhost:8000${NC}"
    else
        echo -e "${RED}❌ エラー: DynamoDB Localの起動に失敗しました${NC}"
        echo -e "${YELLOW}解決方法:${NC}"
        echo -e "  1. Dockerが起動していることを確認: docker --version"
        echo -e "  2. ポートが使用中でないか確認: lsof -i :8000 -i :8001"
        echo -e "  3. Docker Composeファイルを確認: docker compose config"
        echo -e "  4. 既存のコンテナを停止: docker compose down"
        return 1
    fi
}

# DB停止
stop_db() {
    echo -e "${BLUE}=== DynamoDB Local停止 ===${NC}"
    echo -e "${YELLOW}🗄️  DynamoDB Localを停止中...${NC}"
    
    if docker compose stop dynamodb-local dynamodb-admin; then
        echo -e "${GREEN}✓ DynamoDB Local停止完了${NC}"
    else
        echo -e "${RED}❌ エラー: DynamoDB Localの停止に失敗しました${NC}"
        echo -e "${YELLOW}解決方法:${NC}"
        echo -e "  1. 実行中のコンテナを確認: docker compose ps"
        echo -e "  2. 強制停止: docker compose down"
        echo -e "  3. 全てのコンテナを確認: docker ps -a"
        return 1
    fi
}

# バックエンド起動
start_backend() {
    echo -e "${BLUE}=== バックエンドサーバー起動 ===${NC}"
    
    check_directory "backend" || return 1
    
    cd backend
    
    # 仮想環境をアクティベート
    if ! activate_venv; then
        echo -e "${RED}❌ エラー: 仮想環境のアクティベートに失敗しました${NC}"
        return 1
    fi
    
    # run_local.pyの存在確認
    if [ ! -f "run_local.py" ]; then
        echo -e "${RED}❌ エラー: run_local.pyが見つかりません${NC}"
        echo -e "${YELLOW}解決方法:${NC}"
        echo -e "  1. backendディレクトリにいることを確認: pwd"
        echo -e "  2. ファイルの存在を確認: ls -la run_local.py"
        return 1
    fi
    
    echo -e "${YELLOW}🚀 バックエンドサーバーを起動中...${NC}"
    export JANLOG_ENV=local
    echo -e "${GREEN}✓ バックエンドサーバー起動準備完了${NC}"
    echo -e "${GREEN}🚀 API: http://localhost:8080${NC}"
    echo -e "${GREEN}📖 ドキュメント: http://localhost:8080/docs${NC}"
    echo ""
    echo -e "${YELLOW}停止するには Ctrl+C を押してください${NC}"
    
    # サーバー起動（フォアグラウンド）
    if ! python run_local.py; then
        echo -e "${RED}❌ エラー: バックエンドサーバーの起動に失敗しました${NC}"
        echo -e "${YELLOW}解決方法:${NC}"
        echo -e "  1. ポート8080が使用中でないか確認: lsof -i :8080"
        echo -e "  2. DynamoDB Localが起動していることを確認: make check"
        echo -e "  3. 環境変数を確認: echo \$JANLOG_ENV"
        echo -e "  4. 依存関係を確認: pip list | grep fastapi"
        return 1
    fi
}

# フロントエンド起動
start_frontend() {
    echo -e "${BLUE}=== フロントエンド起動 ===${NC}"
    
    check_directory "frontend" || return 1
    
    cd frontend
    
    if ! check_node_dependencies; then
        echo -e "${RED}❌ エラー: Node.js依存関係の確認に失敗しました${NC}"
        return 1
    fi
    
    # package.jsonの存在確認
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ エラー: package.jsonが見つかりません${NC}"
        echo -e "${YELLOW}解決方法:${NC}"
        echo -e "  1. frontendディレクトリにいることを確認: pwd"
        echo -e "  2. ファイルの存在を確認: ls -la package.json"
        return 1
    fi
    
    echo -e "${YELLOW}📱 Expoサーバーを起動中...${NC}"
    echo -e "${GREEN}✓ フロントエンド起動準備完了${NC}"
    echo ""
    echo -e "${YELLOW}停止するには Ctrl+C を押してください${NC}"
    
    # Expo起動（フォアグラウンド）
    if ! npm start; then
        echo -e "${RED}❌ エラー: フロントエンドの起動に失敗しました${NC}"
        echo -e "${YELLOW}解決方法:${NC}"
        echo -e "  1. Node.jsのバージョンを確認: node --version (v18以上推奨)"
        echo -e "  2. Expoがインストールされていることを確認: npx expo --version"
        echo -e "  3. ポートが使用中でないか確認: lsof -i :8081"
        echo -e "  4. node_modulesを再インストール: rm -rf node_modules && npm install"
        return 1
    fi
}

# メイン処理
case $TARGET in
    db-start)
        start_db
        ;;
    db-stop)
        stop_db
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    *)
        echo -e "${RED}エラー: 不明なターゲット '$TARGET'${NC}"
        echo "有効なターゲット: db-start, db-stop, backend, frontend"
        exit 1
        ;;
esac