# Janlog 開発用Makefile

# 色定義
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m

.PHONY: help setup test test-frontend test-backend test-infra test-all tf tb ti start start-db start-backend start-frontend sd sb sf stop clean db-create-tables db-seed db-reset check

# デフォルトターゲット
help:
	@echo "$(BLUE)Janlog 開発用コマンド$(NC)"
	@echo ""
	@echo "$(YELLOW)🚀 ローカル環境起動:$(NC)"
	@echo "  make start              - 全サービス起動ガイド表示"
	@echo "  make start-db      (sd) - DynamoDB Local起動"
	@echo "  make start-backend (sb) - バックエンドサーバー起動"
	@echo "  make start-frontend(sf) - フロントエンド起動"
	@echo "  make stop               - 全サービス停止"
	@echo ""
	@echo "$(YELLOW)🧪 テスト実行:$(NC)"
	@echo "  make test               - 全コンポーネントテスト"
	@echo "  make test-frontend (tf) - フロントエンドテストのみ"
	@echo "  make test-backend  (tb) - バックエンドテストのみ"
	@echo "  make test-infra    (ti) - インフラテストのみ"
	@echo ""
	@echo "$(YELLOW)⚙️  セットアップ:$(NC)"
	@echo "  make setup              - 初回セットアップ（未実装、README.md参照）"
	@echo ""
	@echo "$(YELLOW)🗄️  データベース管理:$(NC)"
	@echo "  make db-start           - DynamoDB Local起動"
	@echo "  make db-stop            - DynamoDB Local停止"
	@echo "  make db-create-tables   - テーブル作成＆初期データセット登録"
	@echo "  make db-seed            - サンプルデータ投入（未実装）"
	@echo "  make db-reset           - データリセット（未実装）"
	@echo "  $(RED)make db-clean     - DynamoDB Localクリーンアップ（破壊的）$(NC)"
	@echo ""
	@echo "$(YELLOW)🔍 その他:$(NC)"
	@echo "  make check              - 開発環境確認"
	@echo ""
	@echo "$(GREEN)💡 使用例:$(NC)"
	@echo "  make start                     # 個別ターミナル起動ガイド表示"
	@echo "  make test-backend              # バックエンドのみテスト"
	@echo "  make db-create-tables          # データベース初期化"

# ローカル環境起動
start:
	@echo "$(BLUE)=== Janlog 個別ターミナル起動ガイド ===$(NC)"
	@echo ""
	@echo "$(YELLOW)推奨: 各サービスを個別ターミナルで起動してログを確認$(NC)"
	@echo ""
	@echo "$(YELLOW)ターミナル1: DynamoDB Local$(NC)"
	@echo "  make start-db"
	@echo ""
	@echo "$(YELLOW)ターミナル2: バックエンドサーバー$(NC)"
	@echo "  make start-backend"
	@echo ""
	@echo "$(YELLOW)ターミナル3: フロントエンド$(NC)"
	@echo "  make start-frontend"
	@echo ""
	@echo "$(GREEN)各ターミナルでログを個別に確認できます$(NC)"

start-db:
	@./scripts/bin/start-runner.sh db

start-backend:
	@./scripts/bin/start-runner.sh backend

start-frontend:
	@./scripts/bin/start-runner.sh frontend

stop:
	@echo "$(YELLOW)全サービスを停止中...$(NC)"
	@docker-compose stop dynamodb-local dynamodb-admin
	@echo "$(GREEN)✓ 全サービス停止完了$(NC)"
	@echo "$(YELLOW)💡 バックエンド・フロントエンドは各ターミナルでCtrl+Cで停止してください$(NC)"

# セットアップ
setup:
	@echo "$(RED)⚠️  統合セットアップ機能は未実装です$(NC)"
	@echo "$(YELLOW)セットアップ手順はREADME.mdを参照してください$(NC)"
	@echo ""
	@echo "$(BLUE)手動セットアップの概要:$(NC)"
	@echo "1. 各コンポーネントのREADME.mdを確認"
	@echo "2. 必要な依存関係をインストール"
	@echo "3. 環境設定ファイルを作成"
	@echo "4. make db-create-tables でデータベース初期化"
	@echo ""
	@echo "$(GREEN)詳細手順: README.md$(NC)"

# テスト実行
test: test-all

test-all:
	@echo "$(BLUE)=== 全テスト実行 ===$(NC)"
	@failed=0; \
	./scripts/bin/test-runner.sh frontend || failed=1; \
	echo ""; \
	./scripts/bin/test-runner.sh backend || failed=1; \
	echo ""; \
	./scripts/bin/test-runner.sh infra || failed=1; \
	echo ""; \
	if [ $$failed -eq 0 ]; then \
		echo "$(GREEN)🎉 全てのテストが成功しました！$(NC)"; \
	else \
		echo "$(RED)❌ 一部のテストが失敗しました$(NC)"; \
		exit 1; \
	fi

test-frontend:
	@./scripts/bin/test-runner.sh frontend

test-backend:
	@./scripts/bin/test-runner.sh backend

test-infra:
	@./scripts/bin/test-runner.sh infra

# テスト短縮形
tf: test-frontend

tb: test-backend

ti: test-infra

# 起動短縮形
sd: start-db

sb: start-backend

sf: start-frontend

# データベース管理

db-clean:
	@echo "$(RED)⚠️  Docker環境をクリーンアップします$(NC)"
	@read -p "続行しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	@echo "$(YELLOW)Docker環境クリーンアップ中...$(NC)"
	@docker-compose down -v
	@docker system prune -f
	@echo "$(GREEN)✓ クリーンアップ完了$(NC)"

db-create-tables:
	@echo "$(YELLOW)DynamoDBテーブル作成＆初期データセット登録中...$(NC)"
	@cd backend && python scripts/create_local_tables.py
	@echo "$(GREEN)✓ テーブル作成完了（test-user-001、デフォルトルールセット含む）$(NC)"

db-seed:
	@echo "$(RED)⚠️  db-seed機能は未実装です$(NC)"
	@echo "$(YELLOW)現在はdb-create-tablesで初期データも含めて作成されます$(NC)"
	@echo "将来的に既存テーブルへのデータ追加機能として実装予定"

db-reset:
	@echo "$(RED)⚠️  db-reset機能は未実装です$(NC)"
	@echo "$(YELLOW)現在はdb-create-tablesでテーブル削除＆再作成されます$(NC)"
	@echo "将来的にデータのみリセット機能として実装予定"

# 開発環境確認
check:
	@echo "$(BLUE)=== 開発環境確認 ===$(NC)"
	@echo "$(YELLOW)Docker Compose サービス状態:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)DynamoDB Local接続確認:$(NC)"
	@curl -s http://localhost:8000 > /dev/null && echo "$(GREEN)✅ DynamoDB Local: 接続OK$(NC)" || echo "$(RED)❌ DynamoDB Local: 接続NG$(NC)"
	@echo ""
	@echo "$(YELLOW)バックエンドAPI確認:$(NC)"
	@curl -s http://localhost:8080/health > /dev/null && echo "$(GREEN)✅ Backend API: 接続OK$(NC)" || echo "$(RED)❌ Backend API: 接続NG$(NC)"
	@echo ""
	@echo "$(YELLOW)フロントエンド確認:$(NC)"
	@curl -s http://localhost:8081 > /dev/null && echo "$(GREEN)✅ Frontend (Expo): 接続OK$(NC)" || echo "$(RED)❌ Frontend (Expo): 接続NG$(NC)"
	@echo ""
	@echo "$(BLUE)開発環境URL:$(NC)"
	@echo "$(GREEN)🗄️  DynamoDB管理画面: http://localhost:8001$(NC)"
	@echo "$(GREEN)🚀 バックエンドAPI: http://localhost:8080$(NC)"
	@echo "$(GREEN)📖 API ドキュメント: http://localhost:8080/docs$(NC)"
	@echo "$(GREEN)📱 フロントエンド: http://localhost:8081$(NC)"