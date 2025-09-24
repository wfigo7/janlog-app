# 開発コマンドガイド

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
```

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
# 全サービス停止
make stop
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

| サービス | URL | 説明 |
|---------|-----|------|
| DynamoDB管理画面 | http://localhost:8001 | DynamoDB Localの管理画面 |
| バックエンドAPI | http://localhost:8080 | FastAPI サーバー |
| APIドキュメント | http://localhost:8080/docs | Swagger UI |
| フロントエンド | http://localhost:8081 | Expo開発サーバー |

## 📋 全コマンド一覧

### ローカル環境起動
| コマンド | 短縮形 | 説明 |
|---------|--------|------|
| `make start` | - | 個別ターミナル起動ガイド表示 |
| `make start-db` | `make sd` | DynamoDB Local起動 |
| `make start-backend` | `make sb` | バックエンドサーバー起動 |
| `make start-frontend` | `make sf` | フロントエンド起動 |
| `make stop` | - | 全サービス停止 |

### テスト実行
| コマンド | 短縮形 | 説明 |
|---------|--------|------|
| `make test` | - | 全コンポーネントテスト |
| `make test-frontend` | `make tf` | フロントエンドテスト |
| `make test-backend` | `make tb` | バックエンドテスト |
| `make test-infra` | `make ti` | インフラテスト |

### データベース管理
| コマンド | 説明 | 状態 |
|---------|------|------|
| `make db-start` | DynamoDB Local起動 | ✅ 実装済み |
| `make db-stop` | DynamoDB Local停止 | ✅ 実装済み |
| `make db-create-tables` | テーブル作成＆初期データ登録 | ✅ 実装済み |
| `make db-seed` | サンプルデータ投入 | ⚠️ 未実装 |
| `make db-reset` | データリセット | ⚠️ 未実装 |
| `make db-clean` | Docker環境クリーンアップ | ✅ 実装済み |

### その他
| コマンド | 説明 | 状態 |
|---------|------|------|
| `make setup` | 初回セットアップ | ⚠️ 未実装（README.md参照） |
| `make check` | 開発環境確認 | ✅ 実装済み |
| `make help` | コマンド一覧表示 | ✅ 実装済み |

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
docker-compose ps

# ログ確認
docker-compose logs dynamodb-local

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