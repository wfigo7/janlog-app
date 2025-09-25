# Design Document

## Overview

現在のMakefileを段階的に改良し、実務レベルでの堅牢性、保守性、安全性を向上させます。ChatGPTのレビューで指摘された問題点を解決しつつ、Janlogプロジェクトの特性（モノレポ構成、Docker Compose使用、Python仮想環境）に最適化した設計とします。

既存の`scripts/bin/`配下のヘルパースクリプトとの連携を維持しながら、Makefile自体の品質を向上させることを目指します。

## Architecture

### 改良アプローチ

1. **段階的改良**: 既存の動作を維持しながら、安全に改良を進める
2. **後方互換性**: 現在使用されているコマンドの動作を変更しない
3. **スクリプト連携**: 既存の`scripts/bin/`配下のスクリプトとの連携を維持
4. **プロジェクト最適化**: Janlogプロジェクトの特性に合わせた最適化

### 設計原則

- **安全性優先**: 破壊的操作の制限とエラーハンドリング強化
- **保守性向上**: 自動化されたヘルプ生成と一貫性確保
- **開発効率**: 実用的な機能追加と短縮コマンド維持
- **環境対応**: クロスプラットフォーム対応とDocker V2対応

## Components and Interfaces

### 1. Makefile本体の改良

#### 基本設定の強化
```makefile
# シェル設定の明示化
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
```

#### ターゲット定義の一貫性確保
- helpに表示されるコマンド名と実際のターゲット名を完全一致
- .PHONYディレクティブに全ターゲットを含める
- 未実装ターゲットの適切な処理

#### Docker Compose V2対応
- 全ての`docker-compose`を`docker compose`に変更
- 既存のサービス名（`dynamodb-local`, `dynamodb-admin`）を維持

### 2. 自動化されたヘルプシステム

#### 高度なコメントベースのヘルプ生成

実装では、より高度なヘルプ生成システムを採用：
- **カテゴリ分け**: `##@`コメントでセクション分けを実現
- **短縮形表示**: `@shortcut:`アノテーションで短縮形を自動表示
- **破壊的操作警告**: `@destructive`アノテーションで赤文字警告
- **エイリアス除外**: `@alias`アノテーションでエイリアスをヘルプから除外
```makefile
help: ## 利用可能コマンドを表示
	@awk 'BEGIN{FS=":.*## "}; /^[a-zA-Z0-9_\/%-]+:.*## /{printf "  \033[36m%-24s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

start-db: ## DynamoDB Local起動
	@./scripts/bin/start-runner.sh db
```

### 3. 安全性強化

#### Python仮想環境の適切な処理

実装では、`scripts/bin/common.sh`の`activate_venv()`関数を活用：

```makefile
db-create-tables: ## テーブル作成＆初期データセット登録
	@echo -e "$(YELLOW)DynamoDBテーブル作成＆初期データセット登録中...$(NC)"
	@cd backend && \
	source ../$(COMMON_SCRIPT) && \
	if activate_venv; then \
		if python scripts/create_local_tables.py; then \
			echo -e "$(GREEN)✓ テーブル作成完了$(NC)"; \
		else \
			echo -e "$(RED)❌ テーブル作成に失敗しました$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo -e "$(RED)❌ Python仮想環境のアクティベートに失敗しました$(NC)"; \
		exit 1; \
	fi
```

#### 破壊的操作の制限
```makefile
db-clean: ## このプロジェクトのcompose リソースのみ削除（破壊的）
	@echo "$(RED)⚠️ このプロジェクトのcompose リソースのみを削除します$(NC)"
	@read -p "続行しますか？ (y/N): " confirm && [ "$$confirm" = "y" ]
	@echo "$(YELLOW)Docker環境クリーンアップ中...$(NC)"
	docker compose down -v --remove-orphans
	docker image prune -f
	@echo "$(GREEN)✓ クリーンアップ完了$(NC)"
```

### 4. ヘルスチェックの信頼性向上

#### HTTPステータスコードの適切な検証
```makefile
check: ## 開発環境確認
	@echo "$(BLUE)=== 開発環境確認 ===$(NC)"
	@echo "$(YELLOW)Docker Compose サービス状態:$(NC)"
	docker compose ps
	@echo ""
	@echo "$(YELLOW)DynamoDB Local接続確認:$(NC)"
	if curl -f -s -S http://localhost:8000/ >/dev/null; then \
		echo "$(GREEN)✅ DynamoDB Local: 接続OK$(NC)"; \
	else \
		echo "$(RED)❌ DynamoDB Local: 接続NG$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)バックエンドAPI確認:$(NC)"
	if curl -f -s -S http://localhost:8080/health >/dev/null; then \
		echo "$(GREEN)✅ Backend API: 接続OK$(NC)"; \
	else \
		echo "$(RED)❌ Backend API: 接続NG$(NC)"; \
	fi
```

### 5. 追加の便利機能

#### cleanターゲットの実装

実装では、より詳細な削除対象と確認プロンプトを追加：

```makefile
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
```

#### 短縮コマンドとエイリアスの実装

実装では、短縮形とエイリアスを分離：

```makefile
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
```

## Data Models

### Makefileの構造

```
Makefile
├── 基本設定（SHELL, .SHELLFLAGS, .ONESHELL等）
├── 変数定義（色定義、PY変数等）
├── 環境変数読み込み（.env, .env.local）
├── .PHONYディレクティブ
├── helpターゲット（自動生成）
├── 起動系ターゲット（start-*, sd, sb, sf）
├── テスト系ターゲット（test-*, tf, tb, ti）
├── データベース系ターゲット（db-*）
├── ユーティリティターゲット（check, clean, setup）
└── エイリアス・ラッパーターゲット
```

### スクリプト連携

```
Makefile → scripts/bin/start-runner.sh → common.sh
         → scripts/bin/test-runner.sh → common.sh
```

## Error Handling

### エラー検知の強化

1. **シェルレベル**: `-eu -o pipefail`でエラーを確実に検知
2. **コマンドレベル**: curlの`-f -S -s`オプションでHTTPエラーを検知
3. **Python実行**: 仮想環境の存在確認とアクティベート失敗の処理
4. **Docker操作**: サービス固有の操作に限定してリスクを軽減

### エラーメッセージの改善

- 具体的なエラー内容の表示
- 解決方法を含む案内の提供
- 色分けによる視覚的な区別（赤：エラー、黄：警告、緑：成功）

## Testing Strategy

### 段階的テスト計画

1. **Phase 1**: 基本設定の変更
   - シェル設定の追加
   - 変数定義の追加
   - 既存コマンドの動作確認

2. **Phase 2**: Docker Compose V2対応
   - `docker-compose`を`docker compose`に変更
   - 全サービスの起動・停止確認

3. **Phase 3**: 安全性強化
   - Python仮想環境処理の改良
   - 破壊的操作の制限
   - ヘルスチェックの改良

4. **Phase 4**: 機能追加
   - 自動ヘルプ生成
   - cleanターゲット実装
   - エイリアス追加

### テスト項目

- 全ターゲットの実行確認
- エラーケースでの適切な処理
- 短縮コマンドの動作確認
- ヘルプ表示の正確性
- Docker操作の安全性

### 検証環境

- 開発者のローカル環境（WSL2 + Docker Desktop）
- 各コンポーネント（frontend, backend, infra）の個別テスト
- 統合テストでの全体動作確認

## Implementation Notes

### 既存機能の保持

- 現在の色定義とメッセージ形式を維持
- `scripts/bin/`配下のスクリプトとの連携を維持
- 短縮コマンド（tf, tb, ti, sd, sb, sf）を維持

### 段階的移行

1. 新しい設定を追加（既存動作に影響なし）
2. Docker Compose V2に移行（互換性あり）
3. 安全性機能を追加（より安全に）
4. 便利機能を追加（開発効率向上）

### プロジェクト固有の最適化

- Janlogアプリの3つのコンポーネント構成に対応
- DynamoDB Localの管理機能強化
- Python仮想環境の適切な処理（`scripts/bin/common.sh`の`activate_venv()`関数活用）
- モノレポ構成での効率的な操作

### 実装で追加された機能

- **setupターゲット**: 統合セットアップのガイド表示（実装は将来予定）
- **高度なヘルスチェック**: サービス固有の接続確認とエラーガイダンス
- **確認プロンプト**: 破壊的操作での詳細な警告と確認
- **エラーハンドリング**: 具体的な解決方法を含むエラーメッセージ
- **カテゴリ別ヘルプ**: 絵文字付きのセクション分けでユーザビリティ向上