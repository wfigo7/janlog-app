# Makefileコマンドガイド

このプロジェクトでは、Makefileを使用して開発に必要な全てのコマンドを統一的に実行できます。

## クイックスタート

```bash
# コマンド一覧を確認
make help

# 個別ターミナル起動ガイドを表示
make start

# 全テスト実行
make test

# 開発環境確認
make check

# 生成物とキャッシュの削除
make clean
```

## 📁 サブディレクトリからのmake実行対応

**どのディレクトリからでも同じmakeコマンドが使用可能です！**

### 使用例

```bash
# フロントエンド開発中
cd frontend
make start-frontend  # ルートから実行したのと同じ動作
make tf              # フロントエンドテスト実行
make help            # ルートのヘルプが表示される

# バックエンド開発中
cd backend
make test-backend    # バックエンドテスト実行
make tb              # 短縮形も使用可能
make start-db        # DynamoDB Local起動

# インフラ開発中
cd infra
make test-infra      # インフラテスト実行
make ti              # 短縮形も使用可能
make check           # 環境確認
```

### 仕組み

- **プロジェクトルート検出**: `.root`マーカーファイルでプロジェクトルートを自動識別
- **動的委譲**: サブディレクトリのMakefileが全てのコマンドをルートのMakefileに委譲
- **軽量実装**: サブディレクトリのMakefileは10行程度の最小実装
- **完全な保守性**: 新しいコマンドを追加してもサブディレクトリのMakefileは変更不要

### 開発効率の向上

- **コンテキストスイッチ削減**: ディレクトリ移動なしでコマンド実行
- **一貫した操作感**: どこにいても同じコマンドが使用可能
- **タイピング効率**: 短縮形コマンドもサブディレクトリから使用可能

## 🚀 ローカル環境起動

### 基本コマンド

```bash
# 個別ターミナル起動ガイド表示（推奨）
make start

# 各サービスを個別起動
make start-db         # DynamoDB Local起動
make start-backend    # バックエンドサーバー起動
make start-frontend   # フロントエンド起動

# 短縮形
make sd    # start-db
make sb    # start-backend
make sf    # start-frontend
```

### 停止・クリーンアップ

```bash
# DynamoDB Local停止
make stop-db

# 表記ゆれ解消用エイリアス
make db-start    # start-dbのエイリアス
make db-stop     # stop-dbのエイリアス
```

### 個別ターミナル起動の推奨理由

- **ログの分離**: 各サービスのログを個別に確認可能
- **デバッグの容易さ**: 問題のあるサービスを特定しやすい
- **開発効率**: 必要なサービスのみ起動・停止可能

## 🧪 テスト実行

### 基本コマンド

```bash
# 全コンポーネントテスト
make test

# 個別テスト
make test-frontend    # フロントエンドテスト
make test-backend     # バックエンドテスト
make test-infra       # インフラテスト

# 短縮形（高速タイピング用）
make tf    # test-frontend
make tb    # test-backend
make ti    # test-infra
```

### 各コンポーネントのテスト内容

#### フロントエンド (`make test-frontend`)
- **テストフレームワーク**: Jest + React Native Testing Library
- **実行内容**:
  - 依存関係の自動チェック・インストール
  - TypeScript型チェック (`npm run type-check`)
  - ESLint (`npm run lint`)
  - Jestテストの実行 (`npm test`)

#### バックエンド (`make test-backend`)
- **テストフレームワーク**: pytest
- **実行内容**:
  - 仮想環境の確認・アクティベート
  - 依存関係の自動チェック・インストール
  - pytestによるテスト実行 (`python -m pytest tests/ -v`)

#### インフラ (`make test-infra`)
- **テストフレームワーク**: CDK構文チェック + Jest
- **実行内容**:
  - 依存関係の自動チェック・インストール
  - TypeScript型チェック (`npm run type-check`)
  - ESLint (`npm run lint`)
  - CDKテスト または CDK構文チェック (`npm run synth`)

## ⚙️ セットアップ

```bash
# セットアップガイド表示（統合セットアップは未実装）
make setup
```

**注意**: 統合セットアップ機能は未実装です。詳細なセットアップ手順はREADME.mdを参照してください。

## 🗄️ データベース管理

### 基本コマンド

```bash
# DynamoDB Local起動・停止
make db-start    # 起動
make db-stop     # 停止

# テーブル作成＆初期データセット登録
make db-create-tables

# Docker環境クリーンアップ（破壊的操作）
make db-clean
```

### 未実装機能

以下の機能は将来実装予定です：

```bash
# サンプルデータ投入（未実装）
make db-seed

# データリセット（未実装）
make db-reset
```

現在は`make db-create-tables`でテーブル削除＆再作成＋初期データ投入が行われます。

## 🔍 開発環境確認

```bash
# 全サービスの起動状態確認
make check
```

以下の項目をチェックします：
- Docker Composeサービス状態
- DynamoDB Local接続確認 (http://localhost:8000)
- バックエンドAPI接続確認 (http://localhost:8080)
- フロントエンド接続確認 (http://localhost:8081)

### 開発環境URL一覧

| サービス         | URL                        | 説明                     |
| ---------------- | -------------------------- | ------------------------ |
| DynamoDB管理画面 | http://localhost:8001      | DynamoDB Localの管理画面 |
| バックエンドAPI  | http://localhost:8080      | FastAPI サーバー         |
| APIドキュメント  | http://localhost:8080/docs | Swagger UI               |
| フロントエンド   | http://localhost:8081      | Expo開発サーバー         |

## 📋 全コマンド一覧

### ローカル環境起動
| コマンド              | 短縮形    | 説明                         |
| --------------------- | --------- | ---------------------------- |
| `make start`          | -         | 個別ターミナル起動ガイド表示 |
| `make start-db`       | `make sd` | DynamoDB Local起動           |
| `make start-backend`  | `make sb` | バックエンドサーバー起動     |
| `make start-frontend` | `make sf` | フロントエンド起動           |
| `make stop-db`        | -         | DynamoDB Local停止           |

### テスト実行
| コマンド             | 短縮形    | 説明                   |
| -------------------- | --------- | ---------------------- |
| `make test`          | -         | 全コンポーネントテスト |
| `make test-frontend` | `make tf` | フロントエンドテスト   |
| `make test-backend`  | `make tb` | バックエンドテスト     |
| `make test-infra`    | `make ti` | インフラテスト         |

### データベース管理
| コマンド                | 説明                         | 状態       |
| ----------------------- | ---------------------------- | ---------- |
| `make db-start`         | DynamoDB Local起動           | ✅ 実装済み |
| `make db-stop`          | DynamoDB Local停止           | ✅ 実装済み |
| `make db-create-tables` | テーブル作成＆初期データ登録 | ✅ 実装済み |
| `make db-seed`          | サンプルデータ投入           | ⚠️ 未実装   |
| `make db-reset`         | データリセット               | ⚠️ 未実装   |
| `make db-clean`         | Docker環境クリーンアップ     | ✅ 実装済み |

### その他
| コマンド     | 説明                     | 状態                      |
| ------------ | ------------------------ | ------------------------- |
| `make setup` | 初回セットアップ         | ⚠️ 未実装（README.md参照） |
| `make check` | 開発環境確認             | ✅ 実装済み                |
| `make clean` | 生成物とキャッシュの削除 | ✅ 実装済み                |
| `make help`  | コマンド一覧表示         | ✅ 実装済み                |

## 🛠️ 開発ワークフロー

### 推奨開発フロー

1. **初回セットアップ**:
   ```bash
   # README.mdの手順に従って手動セットアップ
   make setup    # ガイド表示
   ```

2. **開発環境起動**:
   ```bash
   make start    # 個別ターミナル起動ガイド表示
   # 各ターミナルで以下を実行
   make sd       # ターミナル1: DB起動
   make sb       # ターミナル2: バックエンド起動
   make sf       # ターミナル3: フロントエンド起動
   ```

3. **開発中のテスト**:
   ```bash
   make tb       # バックエンドテスト（高速）
   make tf       # フロントエンドテスト
   ```

4. **コミット前の確認**:
   ```bash
   make test     # 全コンポーネントテスト
   make check    # 全サービス起動確認
   ```

5. **環境リセット**（必要時）:
   ```bash
   make db-clean    # Docker環境クリーンアップ
   make clean       # 生成物とキャッシュの削除
   ```

## 🔧 エラーハンドリングと問題解決

### 改善されたエラーメッセージ

Makefileとヘルパースクリプトは、エラー発生時に具体的な解決方法を提案します：

```bash
# 例: 仮想環境が見つからない場合
❌ エラー: 仮想環境が見つかりません (venv)
解決方法:
  1. 仮想環境を作成: python -m venv venv
  2. 仮想環境をアクティベート: source venv/bin/activate
  3. 依存関係をインストール: pip install -r requirements.txt
  4. 詳細な手順: backend/README.md を参照
```

### よくある問題と解決方法

#### 1. DynamoDB Local接続エラー
```bash
make check  # 詳細な診断情報を表示
make start-db  # DynamoDB Localを起動
```

#### 2. Python仮想環境の問題
```bash
# backend/README.md を参照して仮想環境を作成
cd backend
# 詳細な手順はREADME.mdに記載
```

#### 3. Node.js依存関係の問題
```bash
# 各コンポーネントのREADME.mdを参照
cd frontend  # または infra
# 詳細な手順はREADME.mdに記載
```

#### 4. ポート競合の問題
```bash
# 使用中のポートを確認
lsof -i :8000  # DynamoDB Local
lsof -i :8080  # Backend API
lsof -i :8081  # Frontend
```

### テスト失敗時の対応

```bash
# 全テスト実行（詳細なエラー情報付き）
make test

# 個別テスト実行
make test-frontend  # または tf
make test-backend   # または tb
make test-infra     # または ti

# 環境確認
make check
```

## 🔧 トラブルシューティング

### 仮想環境エラー (バックエンド)

```bash
cd backend
python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows (Git Bash)
source venv/Scripts/activate

pip install -r requirements.txt
```

### 依存関係エラー

```bash
# フロントエンド
cd frontend && npm install

# バックエンド
cd backend && pip install -r requirements.txt

# インフラ
cd infra && npm install
```

### Docker関連エラー

```bash
# Dockerサービス確認
docker compose ps

# ログ確認
docker compose logs dynamodb-local

# 完全リセット
make db-clean
```

## 📚 関連ドキュメント

- **README.md**: プロジェクト概要と初回セットアップ
- **ADR-0006**: スクリプト配置方針の設計決定
- **各コンポーネントのREADME.md**: 詳細なセットアップ手順

## 🚀 CI/CD での使用

GitHub Actions などの CI/CD パイプラインでも使用できます：

```yaml
# .github/workflows/test.yml の例
- name: Run all tests
  run: make test

- name: Run backend tests only
  run: make test-backend

- name: Check environment
  run: make check
```

## 💡 Tips

- **タブ補完**: `make t<Tab>`でテスト関連コマンドが補完されます
- **短縮形活用**: 頻繁に使うコマンドは短縮形（`tf`, `tb`, `ti`, `sd`, `sb`, `sf`）を活用
- **ヘルプ確認**: 迷ったら`make help`でコマンド一覧を確認
- **環境確認**: 問題が発生したら`make check`で各サービスの状態を確認

## 🔧 Makefile改良履歴

### 2025年10月2日: サブディレクトリからのmake実行対応

**新機能**:

#### サブディレクトリからのmake実行対応
- **プロジェクトルート検出**: `.root`マーカーファイルでプロジェクトルートを自動識別
- **動的委譲システム**: `%:`パターンルールで全てのターゲットを自動委譲
- **サブディレクトリ用Makefile**: frontend/, backend/, infra/に軽量なMakefileを配置
- **完全な保守性**: ルートのMakefileにコマンド追加時、サブディレクトリのMakefileは変更不要

**効果**:
- **開発効率向上**: どのディレクトリからでも同じmakeコマンドが使用可能
- **コンテキストスイッチ削減**: ディレクトリ移動なしでコマンド実行
- **一貫した操作感**: 短縮形コマンドもサブディレクトリから使用可能

### 2025年9月25日: 包括的なMakefile改良

**主要な改良内容**:

#### 1. 自動化されたヘルプ生成システム
- **コメントベースヘルプ**: 各ターゲットに`##`コメントを追加し、自動でヘルプを生成
- **カテゴリ分け**: `##@`コメントでカテゴリを定義し、視覚的にグループ化
- **短縮形表示**: 短縮形コマンド（sd, sb, sf, tf, tb, ti）を自動で表示
- **保守性向上**: ターゲット追加時にhelpの手動更新が不要

#### 2. 基本設定の強化とシェル安全性向上
- **シェル安全性強化**: `SHELL := /bin/bash`, `.SHELLFLAGS := -eu -o pipefail -c`, `.ONESHELL`を追加
- **環境変数自動読み込み**: `.env`と`.env.local`ファイルの自動読み込み機能を追加
- **デフォルトゴール**: `help`をデフォルトターゲットに設定

#### 3. Docker Compose V2対応
- **コマンド形式変更**: 全ての`docker-compose`コマンドを`docker compose`（V2形式）に変更
- **影響範囲**: `db-clean`, `check`, `start_db()`, `stop_db()`ターゲット

#### 4. Python仮想環境処理の改良
- **activate_venv関数の活用**: `scripts/bin/common.sh`の共通関数を使用
- **依存関係管理**: 仮想環境の存在確認と適切なエラーメッセージを追加

#### 5. 破壊的操作の安全性強化
- **db-cleanターゲット改良**: プロジェクト固有のリソースのみを削除
- **--remove-orphansオプション追加**: より安全なクリーンアップを実装
- **詳細な警告メッセージ**: 削除対象を明確に表示

#### 6. ヘルスチェックの信頼性向上
- **HTTPステータスコード検証**: `curl -f -S -s`オプションを使用
- **明確なエラーメッセージ**: 各サービスの接続失敗時に具体的な解決方法を表示
- **DynamoDB Local特別対応**: HTTP 400を返すDynamoDB Localに対して適切な接続確認を実装

#### 7. cleanターゲットの実装
- **生成物とキャッシュの削除**: backend/.pytest_cache, backend/.coverage, frontend/.expo等を削除
- **安全な削除処理**: エラーが発生しても処理を継続するよう|| trueを追加

#### 8. 表記ゆれ解消用エイリアス
- **db-start**: start-dbのエイリアスを実装
- **db-stop**: stop-dbのエイリアスを実装（実際にはstop-dbを指す）

**効果**:
- **開発効率向上**: 自動化されたヘルプ生成とエラーハンドリング改善
- **安全性向上**: 破壊的操作の制限とプロジェクト固有リソースのみの操作
- **保守性向上**: ターゲット定義とヘルプ説明の自動同期
- **互換性確保**: Docker Compose V2対応と最新環境への対応