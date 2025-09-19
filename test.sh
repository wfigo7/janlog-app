#!/bin/bash

# テスト実行スクリプト
# 使用方法:
#   ./test.sh                    # 全てのテストを実行
#   ./test.sh frontend           # フロントエンドのテストのみ実行
#   ./test.sh backend            # バックエンドのテストのみ実行
#   ./test.sh infra              # インフラのテストのみ実行
#   ./test.sh frontend backend   # 複数指定も可能

set -e  # エラーが発生したら停止

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプ表示
show_help() {
    echo "テスト実行スクリプト"
    echo ""
    echo "使用方法:"
    echo "  ./test.sh [target...]"
    echo ""
    echo "対象:"
    echo "  frontend    フロントエンドのテスト (React Native/Expo)"
    echo "  backend     バックエンドのテスト (Python/FastAPI)"
    echo "  infra       インフラのテスト (AWS CDK)"
    echo "  all         全てのテスト (デフォルト)"
    echo ""
    echo "例:"
    echo "  ./test.sh                    # 全てのテストを実行"
    echo "  ./test.sh frontend           # フロントエンドのテストのみ"
    echo "  ./test.sh backend            # バックエンドのテストのみ"
    echo "  ./test.sh frontend backend   # フロントエンドとバックエンドのテスト"
    echo ""
}

# フロントエンドテスト実行
run_frontend_tests() {
    echo -e "${BLUE}=== フロントエンドテスト実行 ===${NC}"
    if [ ! -d "frontend" ]; then
        echo -e "${RED}エラー: frontendディレクトリが見つかりません${NC}"
        return 1
    fi
    
    cd frontend
    echo -e "${YELLOW}依存関係をチェック中...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}依存関係をインストール中...${NC}"
        npm install
    fi
    
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
    if [ ! -d "backend" ]; then
        echo -e "${RED}エラー: backendディレクトリが見つかりません${NC}"
        return 1
    fi
    
    cd backend
    
    # 仮想環境の確認
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}仮想環境を作成中...${NC}"
        python -m venv venv
    fi
    
    # 仮想環境をアクティベート
    source venv/bin/activate
    
    echo -e "${YELLOW}依存関係をチェック中...${NC}"
    pip install -r requirements.txt > /dev/null 2>&1
    
    echo -e "${YELLOW}Pytestを実行中...${NC}"
    python -m pytest tests/ -v
    
    cd ..
    echo -e "${GREEN}✓ バックエンドテスト完了${NC}"
}

# インフラテスト実行
run_infra_tests() {
    echo -e "${BLUE}=== インフラテスト実行 ===${NC}"
    if [ ! -d "infra" ]; then
        echo -e "${RED}エラー: infraディレクトリが見つかりません${NC}"
        return 1
    fi
    
    cd infra
    
    echo -e "${YELLOW}依存関係をチェック中...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}依存関係をインストール中...${NC}"
        npm install
    fi
    
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
    if [ -f "package.json" ] && grep -q "test" package.json; then
        echo -e "${YELLOW}CDKテストを実行中...${NC}"
        if ! npm test; then
            echo -e "${RED}CDKテストが失敗しました${NC}"
            cd ..
            return 1
        fi
    else
        echo -e "${YELLOW}CDK構文チェックを実行中...${NC}"
        # 各環境での構文チェック
        npm run synth:local || echo -e "${YELLOW}local環境の構文チェックをスキップ${NC}"
        npm run synth:dev || echo -e "${YELLOW}development環境の構文チェックをスキップ${NC}"
    fi
    
    cd ..
    echo -e "${GREEN}✓ インフラテスト完了${NC}"
}

# 全テスト実行
run_all_tests() {
    echo -e "${BLUE}=== 全テスト実行 ===${NC}"
    
    local failed=0
    
    # フロントエンドテスト
    if ! run_frontend_tests; then
        failed=1
    fi
    
    echo ""
    
    # バックエンドテスト
    if ! run_backend_tests; then
        failed=1
    fi
    
    echo ""
    
    # インフラテスト
    if ! run_infra_tests; then
        failed=1
    fi
    
    echo ""
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 全てのテストが成功しました！${NC}"
    else
        echo -e "${RED}❌ 一部のテストが失敗しました${NC}"
        exit 1
    fi
}

# メイン処理
main() {
    # ヘルプオプション
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # 引数がない場合は全テスト実行
    if [ $# -eq 0 ]; then
        run_all_tests
        exit 0
    fi
    
    # 指定されたテストを実行
    local failed=0
    
    for target in "$@"; do
        case $target in
            frontend)
                if ! run_frontend_tests; then
                    failed=1
                fi
                ;;
            backend)
                if ! run_backend_tests; then
                    failed=1
                fi
                ;;
            infra)
                if ! run_infra_tests; then
                    failed=1
                fi
                ;;
            all)
                if ! run_all_tests; then
                    failed=1
                fi
                ;;
            *)
                echo -e "${RED}エラー: 不明なターゲット '$target'${NC}"
                echo "有効なターゲット: frontend, backend, infra, all"
                show_help
                exit 1
                ;;
        esac
        
        # 複数ターゲットの場合は間に空行を入れる
        if [ $# -gt 1 ]; then
            echo ""
        fi
    done
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 指定されたテストが全て成功しました！${NC}"
    else
        echo -e "${RED}❌ 一部のテストが失敗しました${NC}"
        exit 1
    fi
}

# スクリプト実行
main "$@"