#!/bin/bash

# 共通ユーティリティ関数

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 仮想環境をアクティベート（クロスプラットフォーム対応）
activate_venv() {
    local venv_dir=${1:-"venv"}
    local check_deps=${2:-true}
    
    if [ ! -d "$venv_dir" ]; then
        echo -e "${RED}❌ エラー: 仮想環境が見つかりません ($venv_dir)${NC}"
        echo -e "${YELLOW}解決方法: backend/README.md を参照して仮想環境を作成してください${NC}"
        return 1
    fi
    
    # クロスプラットフォーム対応でアクティベート
    if [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]] || [[ "${OS:-}" == "Windows_NT" ]] || [ -f "$venv_dir/Scripts/activate" ]; then
        # Windows (Git Bash/MSYS2)
        if ! source "$venv_dir/Scripts/activate"; then
            echo -e "${RED}❌ エラー: 仮想環境のアクティベートに失敗しました${NC}"
            echo -e "${YELLOW}解決方法: backend/README.md を参照して仮想環境を再作成してください${NC}"
            return 1
        fi
    else
        # Linux/Mac
        if ! source "$venv_dir/bin/activate"; then
            echo -e "${RED}❌ エラー: 仮想環境のアクティベートに失敗しました${NC}"
            echo -e "${YELLOW}解決方法: backend/README.md を参照して仮想環境を再作成してください${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✓ 仮想環境をアクティベートしました${NC}"
    
    # 依存関係チェック（オプション）
    if [ "$check_deps" = "true" ] && [ -f "requirements.txt" ]; then
        echo -e "${YELLOW}依存関係をチェック中...${NC}"
        if ! python -c "import pydantic" 2>/dev/null; then
            echo -e "${YELLOW}依存関係をインストール中...${NC}"
            if pip install -r requirements.txt; then
                echo -e "${GREEN}✓ 依存関係をインストールしました${NC}"
            else
                echo -e "${RED}❌ エラー: 依存関係のインストールに失敗しました${NC}"
                echo -e "${YELLOW}解決方法: backend/README.md を参照してください${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✓ 依存関係は既にインストール済みです${NC}"
        fi
    fi
}

# ディレクトリ存在チェック
check_directory() {
    local dir_name=$1
    local display_name=${2:-$dir_name}
    
    if [ ! -d "$dir_name" ]; then
        echo -e "${RED}❌ エラー: ${display_name}ディレクトリが見つかりません${NC}"
        echo -e "${YELLOW}解決方法: プロジェクトルートディレクトリで実行してください${NC}"
        return 1
    fi
    return 0
}

# 依存関係チェック（Node.js）
check_node_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}依存関係をインストール中...${NC}"
        if npm install; then
            echo -e "${GREEN}✓ Node.js依存関係をインストールしました${NC}"
        else
            echo -e "${RED}❌ エラー: Node.js依存関係のインストールに失敗しました${NC}"
            echo -e "${YELLOW}解決方法: 各コンポーネントのREADME.md を参照してください${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Node.js依存関係は既にインストール済みです${NC}"
    fi
}

# 依存関係チェック（Python）
check_python_dependencies() {
    echo -e "${YELLOW}依存関係をチェック中...${NC}"
    if pip install -r requirements.txt > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Python依存関係を確認しました${NC}"
    else
        echo -e "${RED}❌ エラー: Python依存関係の確認に失敗しました${NC}"
        echo -e "${YELLOW}解決方法: backend/README.md を参照してください${NC}"
        return 1
    fi
}