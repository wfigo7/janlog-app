# Janlog 開発用Makefile

# シェル設定の強化（安全性向上）
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.ONESHELL:
.DEFAULT_GOAL := help

# 共通スクリプトの読み込み
COMMON_SCRIPT := scripts/bin/common.sh

# 環境変数ファイルの自動読み込み
-include .env
-include .env.local
.EXPORT_ALL_VARIABLES:

# 色定義
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m

.PHONY: help \
  setup \
  start start-db start-backend start-frontend stop-db sd sb sf \
  test test-frontend test-backend test-infra test-all tf tb ti \
  db-create-tables db-seed db-reset db-clean db-start db-stop \
  check clean

# 完全自動化されたヘルプ生成システム
help: ## ヘルプ表示
	@echo -e "$(BLUE)Janlog 開発用コマンド$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; category=""} \
		/^##@/ { \
			category=substr($$0, 5); \
			printf "$(YELLOW)%s:$(NC)\n", category; \
			next \
		} \
		/^[a-zA-Z_-]+:.*##/ && !/@alias/ { \
			target=$$1; desc=$$2; \
			gsub(/^ +| +$$/, "", desc); \
			shortcut=""; \
			destructive=0; \
			if (match(desc, /@shortcut:([a-z]+)/, arr)) { \
				shortcut=" (" arr[1] ")"; \
				gsub(/@shortcut:[a-z]+/, "", desc); \
			} \
			if (match(desc, /@destructive/)) { \
				destructive=1; \
				gsub(/@destructive/, "", desc); \
			} \
			gsub(/^ +| +$$/, "", desc); \
			if (destructive) { \
				printf "  \033[0;31mmake %-20s - %s\033[0m\n", target shortcut, desc \
			} else { \
				printf "  make %-20s - %s\n", target shortcut, desc \
			} \
		}' $(MAKEFILE_LIST)
	@echo ""
	@echo -e "$(GREEN)💡 使用例:$(NC)"
	@echo "  make start                # 個別ターミナル起動ガイド表示"
	@echo "  make test-backend         # バックエンドのみテスト"
	@echo "  make db-create-tables     # データベース初期化"

##@ ⚙️  セットアップ

setup: ## 初回セットアップ（未実装、README.md参照）
	@echo -e "$(RED)⚠️  統合セットアップ機能は未実装です$(NC)"
	@echo -e "$(YELLOW)現在は手動セットアップが必要です$(NC)"
	@echo ""
	@echo -e "$(BLUE)セットアップ手順:$(NC)"
	@echo -e "$(YELLOW)1. 前提条件の確認$(NC)"
	@echo "   - Node.js (v22以上): node --version"
	@echo "   - Python (v3.12以上): python --version"
	@echo "   - Docker & Docker Compose: docker --version"
	@echo ""
	@echo -e "$(YELLOW)2. 依存関係のインストール$(NC)"
	@echo "   - フロントエンド: cd frontend && npm install"
	@echo "   - バックエンド: cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/pip install -r requirements-dev.txt"
	@echo "   - インフラ: cd infra && npm install"
	@echo ""
	@echo -e "$(YELLOW)3. 環境設定ファイルの作成$(NC)"
	@echo "   - cp .envrc.sample .envrc.local"
	@echo "   - cp backend/.env.sample backend/.env.local"
	@echo "   - cp frontend/.env.sample frontend/.env.local"
	@echo ""
	@echo -e "$(YELLOW)4. データベースの初期化$(NC)"
	@echo "   - make start-db"
	@echo "   - make db-create-tables"
	@echo ""
	@echo -e "$(GREEN)詳細手順とトラブルシューティング: README.md$(NC)"
	@echo -e "$(BLUE)セットアップ完了後の確認: make check$(NC)"

##@ 🚀 ローカル環境起動

start: ## 全サービス起動ガイド表示
	@echo -e "$(BLUE)=== Janlog 個別ターミナル起動ガイド ===$(NC)"
	@echo ""
	@echo -e "$(YELLOW)推奨: 各サービスを個別ターミナルで起動してログを確認$(NC)"
	@echo ""
	@echo -e "$(YELLOW)ターミナル1: DynamoDB Local$(NC)"
	@echo "  make start-db"
	@echo ""
	@echo -e "$(YELLOW)ターミナル2: バックエンドサーバー$(NC)"
	@echo "  make start-backend"
	@echo ""
	@echo -e "$(YELLOW)ターミナル3: フロントエンド$(NC)"
	@echo "  make start-frontend"
	@echo ""
	@echo -e "$(GREEN)各ターミナルでログを個別に確認できます$(NC)"

start-db: ## DynamoDB Local起動 @shortcut:sd
	@./scripts/bin/start-runner.sh db-start

start-backend: ## バックエンドサーバー起動 @shortcut:sb
	@./scripts/bin/start-runner.sh backend

start-frontend: ## フロントエンド起動 @shortcut:sf
	@./scripts/bin/start-runner.sh frontend

stop-db: ## DynamoDB Local停止
	@./scripts/bin/start-runner.sh db-stop

##@ 🧪 テスト実行

test: test-all ## 全コンポーネントテスト

test-all:
	@echo -e "$(BLUE)=== 全テスト実行 ===$(NC)"
	@failed=0; \
	failed_components=""; \
	echo -e "$(YELLOW)フロントエンドテスト実行中...$(NC)"; \
	if ./scripts/bin/test-runner.sh frontend; then \
		echo -e "$(GREEN)✓ フロントエンドテスト: 成功$(NC)"; \
	else \
		echo -e "$(RED)❌ フロントエンドテスト: 失敗$(NC)"; \
		failed=1; \
		failed_components="$$failed_components frontend"; \
	fi; \
	echo ""; \
	echo -e "$(YELLOW)バックエンドテスト実行中...$(NC)"; \
	if ./scripts/bin/test-runner.sh backend; then \
		echo -e "$(GREEN)✓ バックエンドテスト: 成功$(NC)"; \
	else \
		echo -e "$(RED)❌ バックエンドテスト: 失敗$(NC)"; \
		failed=1; \
		failed_components="$$failed_components backend"; \
	fi; \
	echo ""; \
	echo -e "$(YELLOW)インフラテスト実行中...$(NC)"; \
	if ./scripts/bin/test-runner.sh infra; then \
		echo -e "$(GREEN)✓ インフラテスト: 成功$(NC)"; \
	else \
		echo -e "$(RED)❌ インフラテスト: 失敗$(NC)"; \
		failed=1; \
		failed_components="$$failed_components infra"; \
	fi; \
	echo ""; \
	if [ "$$failed" -eq 0 ]; then \
		echo -e "$(GREEN)🎉 全てのテストが成功しました！$(NC)"; \
	else \
		echo -e "$(RED)❌ 以下のコンポーネントでテストが失敗しました:$$failed_components$(NC)"; \
		echo -e "$(YELLOW)解決方法:$(NC)"; \
		echo -e "  1. 個別テストで詳細確認: make test-frontend, make test-backend, make test-infra"; \
		echo -e "  2. 依存関係の確認: 各コンポーネントのREADME.mdを参照"; \
		echo -e "  3. 環境の確認: make check"; \
		exit 1; \
	fi

test-frontend: ## フロントエンドテストのみ @shortcut:tf
	@./scripts/bin/test-runner.sh frontend

test-backend: ## バックエンドテストのみ @shortcut:tb
	@./scripts/bin/test-runner.sh backend

test-infra: ## インフラテストのみ @shortcut:ti
	@./scripts/bin/test-runner.sh infra

# テスト短縮形
tf: test-frontend ## フロントエンドテストのみ（短縮形） @alias

tb: test-backend ## バックエンドテストのみ（短縮形） @alias

ti: test-infra ## インフラテストのみ（短縮形） @alias

# 起動短縮形
sd: start-db ## DynamoDB Local起動（短縮形） @alias

sb: start-backend ## バックエンドサーバー起動（短縮形） @alias

sf: start-frontend ## フロントエンド起動（短縮形） @alias

# 表記ゆれ解消用エイリアス
db-start: start-db ## DynamoDB Local起動（エイリアス） @alias

db-stop: stop-db ## DynamoDB Local停止（エイリアス） @alias

##@ 🗄️  データベース管理

db-create-tables: ## テーブル作成＆初期データセット登録
	@echo -e "$(YELLOW)DynamoDBテーブル作成＆初期データセット登録中...$(NC)"
	@cd backend && \
	source ../$(COMMON_SCRIPT) && \
	if activate_venv; then \
		if python scripts/create_local_tables.py; then \
			echo -e "$(GREEN)✓ テーブル作成完了（test-user-001、デフォルトルールセット含む）$(NC)"; \
		else \
			echo -e "$(RED)❌ テーブル作成に失敗しました$(NC)"; \
			echo -e "$(YELLOW)解決方法:$(NC)"; \
			echo -e "  1. DynamoDB Localが起動していることを確認: make start-db"; \
			echo -e "  2. DynamoDB Localの接続確認: make check"; \
			echo -e "  3. 既存のテーブルがある場合: make db-clean && make start-db"; \
			exit 1; \
		fi; \
	else \
		echo -e "$(RED)❌ Python仮想環境のアクティベートに失敗しました$(NC)"; \
		echo -e "$(YELLOW)解決方法:$(NC)"; \
		echo -e "  1. 仮想環境を作成: cd backend && python -m venv .venv"; \
		echo -e "  2. 依存関係をインストール: cd backend && .venv/bin/pip install -r requirements.txt"; \
		echo -e "  3. 詳細な手順: backend/README.md を参照"; \
		exit 1; \
	fi

db-seed: ## サンプルデータ投入（未実装）
	@echo -e "$(RED)⚠️  db-seed機能は未実装です$(NC)"
	@echo -e "$(YELLOW)現在はdb-create-tablesで初期データも含めて作成されます$(NC)"
	@echo "将来的に既存テーブルへのデータ追加機能として実装予定"

db-reset: ## データリセット（未実装）
	@echo -e "$(RED)⚠️  db-reset機能は未実装です$(NC)"
	@echo -e "$(YELLOW)現在はdb-create-tablesでテーブル削除＆再作成されます$(NC)"
	@echo "将来的にデータのみリセット機能として実装予定"

db-clean: ## DynamoDB Localクリーンアップ（破壊的） @destructive
	@echo -e "$(RED)⚠️  このプロジェクトのDocker Composeリソースを削除します$(NC)"
	@echo -e "$(YELLOW)削除対象:$(NC)"
	@echo -e "  - このプロジェクトのコンテナ"
	@echo -e "  - このプロジェクトのボリューム"
	@echo -e "  - このプロジェクトのネットワーク"
	@echo -e "  - 未使用のイメージ（プロジェクト固有）"
	@echo ""
	@read -p "続行しますか？ (y/N): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		@docker compose down -v --remove-orphans
		@docker image prune -f --filter "label=com.docker.compose.project=$(shell basename $(PWD))"
		echo -e "$(GREEN)✓ クリーンアップ完了$(NC)"; \
	else \
		echo -e "$(RED)キャンセルしました$(NC)"; \
	fi

##@ 🔍 その他

check: ## 開発環境確認
	@echo -e "$(BLUE)=== 開発環境確認 ===$(NC)"
	@echo -e "$(YELLOW)Docker Compose サービス状態:$(NC)"
	@docker compose ps
	@echo ""
	@echo -e "$(YELLOW)DynamoDB Local接続確認:$(NC)"
	@if curl -s -S http://localhost:8000/ >/dev/null 2>&1; then \
		echo -e "$(GREEN)✅ DynamoDB Local: 接続OK$(NC)"; \
	else \
		echo -e "$(RED)❌ DynamoDB Local: 接続NG$(NC)"; \
		echo -e "$(YELLOW)  解決方法:$(NC)"; \
		echo -e "    1. DynamoDB Localを起動: make start-db"; \
		echo -e "    2. Dockerサービス確認: docker compose ps"; \
		echo -e "    3. ポート8000が使用中でないか確認: lsof -i :8000"; \
	fi
	@echo ""
	@echo -e "$(YELLOW)バックエンドAPI確認:$(NC)"
	@if curl -s -S http://localhost:8080/health >/dev/null 2>&1; then \
		echo -e "$(GREEN)✅ Backend API: 起動OK$(NC)"; \
	else \
		echo -e "$(RED)❌ Backend API: 接続NG$(NC)"; \
		echo -e "$(YELLOW)  解決方法:$(NC)"; \
		echo -e "    1. バックエンドを起動: make start-backend"; \
		echo -e "    2. Python仮想環境を確認: cd backend && source .venv/bin/activate"; \
		echo -e "    3. 依存関係を確認: cd backend && pip list"; \
		echo -e "    4. ポート8080が使用中でないか確認: lsof -i :8080"; \
	fi
	@echo ""
	@echo -e "$(YELLOW)フロントエンド確認:$(NC)"
	@echo -e "$(YELLOW)  注意: Expoは動的ポートを使用するため、正確な確認が困難です$(NC)"
	@if curl -f -s -S http://localhost:8081/ >/dev/null 2>&1; then \
		echo -e "$(GREEN)✅ Frontend (Expo): 接続OK$(NC)"; \
	else \
		echo -e "$(RED)❌ Frontend (Expo): 接続NG$(NC)"; \
		echo -e "$(YELLOW)  解決方法:$(NC)"; \
		echo -e "    1. フロントエンドを起動: make start-frontend"; \
		echo -e "    2. Node.js依存関係を確認: cd frontend && npm list"; \
		echo -e "    3. Expoの実際のURLを確認: npx expo start --web"; \
		echo -e "    4. ポート8081が使用中でないか確認: lsof -i :8081"; \
	fi
	@echo ""
	@echo -e "$(BLUE)開発環境URL:$(NC)"
	@echo -e "$(GREEN)🗄️  DynamoDB管理画面: http://localhost:8001$(NC)"
	@echo -e "$(GREEN)🚀 バックエンドAPI: http://localhost:8080$(NC)"
	@echo -e "$(GREEN)📖 API ドキュメント: http://localhost:8080/docs$(NC)"
	@echo -e "$(GREEN)📱 フロントエンド: http://localhost:8081$(NC)"

clean: ## 生成物とキャッシュの削除（破壊的） @destructive
	@echo -e "$(RED)⚠️  以下の生成物とキャッシュを削除します$(NC)"
	@echo -e "$(YELLOW)削除対象:$(NC)"
	@echo -e "  - backend/.pytest_cache (Pytestキャッシュ)"
	@echo -e "  - backend/.coverage (カバレッジファイル)"
	@echo -e "  - frontend/.expo (Expoキャッシュ)"
	@echo -e "  - web-build (Webビルド成果物)"
	@echo -e "  - dist (配布用ビルド成果物)"
	@echo -e "  - build (ビルド成果物)"
	@echo ""
	@read -p "続行しますか？ (y/N): " confirm; \
	if [ "$$confirm" = "y" ]; then \
		echo -e "$(YELLOW)生成物とキャッシュを削除中...$(NC)"; \
		rm -rf backend/.pytest_cache backend/.coverage frontend/.expo web-build dist build || true; \
		echo -e "$(GREEN)✓ クリーンアップ完了$(NC)"; \
	else \
		echo -e "$(RED)キャンセルしました$(NC)"; \
	fi
