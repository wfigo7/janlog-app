#!/bin/bash

# テスト実行ヘルパースクリプト
# Makefileから呼び出される

set -e  # エラーが発生したら停止

# 共通関数を読み込み
source "$(dirname "$0")/common.sh"

# 引数チェック
if [ $# -eq 0 ]; then
    echo -e "${RED}エラー: テスト対象を指定してください${NC}"
    echo "使用方法: $0 <frontend|backend|infra>"
    exit 1
fi

TARGET=$1

# フロントエンドテスト実行
run_frontend_tests() {
    echo -e "${BLUE}=== フロントエンドテスト実行 ===${NC}"
    
    check_directory "frontend" || return 1
    
    cd frontend
    check_node_dependencies
    
    echo -e "${YELLOW}TypeScript型チェックを実行中...${NC}"
    if ! npm run type-check; then
        echo -e "${RED}TypeScript型チェックエラーが発生しました${NC}"
        cd ..
        return 1
    fi
    
    echo -e "${YELLOW}ESLintを実行中...${NC}"
    if ! npm run lint; then
        echo -e "${RED}ESLintエラーが発生しました${NC}"
        cd ..
        return 1
    fi
    
    echo -e "${YELLOW}Jestテストを実行中...${NC}"
    if ! npm test; then
        echo -e "${RED}Jestテストが失敗しました${NC}"
        cd ..
        return 1
    fi
    
    cd ..
    echo -e "${GREEN}✓ フロントエンドテスト完了${NC}"
}

# バックエンドテスト実行
run_backend_tests() {
    echo -e "${BLUE}=== バックエンドテスト実行 ===${NC}"
    
    check_directory "backend" || return 1
    
    cd backend
    
    # 仮想環境をアクティベート
    activate_venv || return 1
    
    check_python_dependencies
    
    echo -e "${YELLOW}Pytestを実行中...${NC}"
    python -m pytest tests/ -v
    
    cd ..
    echo -e "${GREEN}✓ バックエンドテスト完了${NC}"
}

# インフラテスト実行
run_infra_tests() {
    echo -e "${BLUE}=== インフラテスト実行 ===${NC}"
    
    check_directory "infra" || return 1
    
    cd infra
    check_node_dependencies
    
    echo -e "${YELLOW}TypeScript型チェックを実行中...${NC}"
    if ! npm run type-check; then
        echo -e "${RED}TypeScript型チェックエラーが発生しました${NC}"
        cd ..
        return 1
    fi
    
    echo -e "${YELLOW}ESLintを実行中...${NC}"
    if ! npm run lint; then
        echo -e "${RED}ESLintエラーが発生しました${NC}"
        cd ..
        return 1
    fi
    
    # CDKのテストがある場合
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        echo -e "${YELLOW}CDKテストを実行中...${NC}"
        if ! npm test; then
            echo -e "${RED}CDKテストが失敗しました${NC}"
            cd ..
            return 1
        fi
    else
        echo -e "${YELLOW}CDK構文チェックを実行中...${NC}"
        # デフォルト環境での構文チェック
        if ! npm run synth; then
            echo -e "${RED}CDK構文チェックが失敗しました${NC}"
            cd ..
            return 1
        fi
    fi
    
    cd ..
    echo -e "${GREEN}✓ インフラテスト完了${NC}"
}

# メイン処理
case $TARGET in
    frontend)
        run_frontend_tests
        ;;
    backend)
        run_backend_tests
        ;;
    infra)
        run_infra_tests
        ;;
    *)
        echo -e "${RED}エラー: 不明なターゲット '$TARGET'${NC}"
        echo "有効なターゲット: frontend, backend, infra"
        exit 1
        ;;
esac