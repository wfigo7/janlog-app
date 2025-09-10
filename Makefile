# Janlog 開発用Makefile

.PHONY: help setup start-db stop-db create-tables start-backend test-backend clean

# デフォルトターゲット
help:
	@echo "Janlog 開発用コマンド"
	@echo ""
	@echo "セットアップ:"
	@echo "  make setup          - 初回セットアップ（Docker起動 + テーブル作成）"
	@echo ""
	@echo "開発:"
	@echo "  make start-db       - DynamoDB Local起動"
	@echo "  make stop-db        - DynamoDB Local停止"
	@echo "  make create-tables  - テーブル作成（サンプルデータ付き）"
	@echo "  make start-backend  - バックエンドサーバー起動"
	@echo ""
	@echo "テスト:"
	@echo "  make test-backend   - バックエンドテスト実行"
	@echo ""
	@echo "その他:"
	@echo "  make clean          - Docker環境クリーンアップ"

# 初回セットアップ
setup:
	@echo "=== 初回セットアップ開始 ==="
	chmod +x backend/scripts/dev_setup.sh
	./backend/scripts/dev_setup.sh

# DynamoDB Local起動
start-db:
	@echo "DynamoDB Local起動中..."
	docker-compose up -d dynamodb-local
	@echo "起動完了。エンドポイント: http://localhost:8000"

# DynamoDB Local停止
stop-db:
	@echo "DynamoDB Local停止中..."
	docker-compose stop dynamodb-local

# テーブル作成
create-tables:
	@echo "DynamoDBテーブル作成中..."
	cd backend && \
	export $$(cat .env.local | grep -v '^#' | xargs) && \
	python scripts/create_local_tables.py --with-sample-data

# バックエンドサーバー起動
start-backend:
	@echo "バックエンドサーバー起動中..."
	cd backend && \
	source venv/bin/activate && \
	python run_local.py

# バックエンドテスト実行
test-backend:
	@echo "バックエンドテスト実行中..."
	cd backend && \
	source venv/bin/activate && \
	export $$(cat .env.local | grep -v '^#' | xargs) && \
	pytest

# Docker環境クリーンアップ
clean:
	@echo "Docker環境クリーンアップ中..."
	docker-compose down -v
	docker system prune -f

# 開発環境確認
check:
	@echo "=== 開発環境確認 ==="
	@echo "Docker Compose サービス状態:"
	@docker-compose ps
	@echo ""
	@echo "DynamoDB Local接続確認:"
	@curl -s http://localhost:8000 > /dev/null && echo "✅ DynamoDB Local: 接続OK" || echo "❌ DynamoDB Local: 接続NG"
	@echo ""
	@echo "バックエンドAPI確認:"
	@curl -s http://localhost:8080/health > /dev/null && echo "✅ Backend API: 接続OK" || echo "❌ Backend API: 接続NG"