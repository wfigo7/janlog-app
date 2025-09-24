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
    
    if [ ! -d "$venv_dir" ]; then
        echo -e "${RED}エラー: 仮想環境が見つかりません ($venv_dir)${NC}"
        echo -e "${YELLOW}セットアップ手順はREADME.mdを参照してください:${NC}"
        echo "  詳細: README.md"
        echo "手動セットアップ概要:"
        echo "  cd backend"
        echo "  python -m venv venv"
        echo "  source venv/bin/activate"
        echo "  pip install -r requirements.txt"
        return 1
    fi
    
    # クロスプラットフォーム対応でアクティベート
    if [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]] || [[ "$OS" == "Windows_NT" ]] || [ -f "$venv_dir/Scripts/activate" ]; then
        # Windows (Git Bash/MSYS2)
        source "$venv_dir/Scripts/activate"
    else
        # Linux/Mac
        source "$venv_dir/bin/activate"
    fi
    
    echo -e "${GREEN}✓ 仮想環境をアクティベートしました${NC}"
}

# ディレクトリ存在チェック
check_directory() {
    local dir_name=$1
    local display_name=${2:-$dir_name}
    
    if [ ! -d "$dir_name" ]; then
        echo -e "${RED}エラー: ${display_name}ディレクトリが見つかりません${NC}"
        return 1
    fi
    return 0
}

# 依存関係チェック（Node.js）
check_node_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}依存関係をインストール中...${NC}"
        npm install
    fi
}

# 依存関係チェック（Python）
check_python_dependencies() {
    echo -e "${YELLOW}依存関係をチェック中...${NC}"
    pip install -r requirements.txt > /dev/null 2>&1
}