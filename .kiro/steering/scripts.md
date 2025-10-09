# スクリプト・コマンド体系

## 基本方針（ADR-0006準拠）

### 実装済みディレクトリ構成
```
/
├── Makefile           # 開発コマンドの統一エントリーポイント
├── .root              # プロジェクトルートマーカー（サブディレクトリからのmake実行用）
├── /scripts           # 開発・運用用スクリプト（主にlocal環境用）
│   ├── bin/           # シェルスクリプト（実行権限付き）
│   │   ├── common.sh       # 共通ユーティリティ関数
│   │   ├── start-runner.sh # 開発環境起動ヘルパー
│   │   └── test-runner.sh  # テスト実行ヘルパー
│   └── python/        # 複雑なPythonスクリプト（現在は空）
├── frontend/Makefile  # サブディレクトリ用Makefile（ルートに委譲）
├── backend/Makefile   # サブディレクトリ用Makefile（ルートに委譲）
├── infra/Makefile     # サブディレクトリ用Makefile（ルートに委譲）
├── backend/scripts/   # バックエンド固有スクリプト
│   ├── db/            # データベース管理スクリプト
│   │   ├── __init__.py
│   │   ├── init_db.py          # 統合初期化
│   │   ├── create_tables.py    # テーブル作成・削除・データクリア
│   │   ├── seed_users.py       # ユーザーseed投入
│   │   ├── seed_rulesets.py    # ルールセットseed投入
│   │   └── utils.py            # 共通ユーティリティ
│   └── generate_mock_jwt.py    # 静的JWT生成
├── backend/seeds/     # Seedデータ（YAMLファイル）
│   ├── users.yaml     # テストユーザーデータ
│   └── rulesets.yaml  # ルールセット定義（参照用）
└── .envrc             # 環境変数定義のみ（aliasなし）
```

### Makefile設計原則（実装済み）
- **実用性重視**: 実際に使用されるコマンドのみ定義
- **統一エントリーポイント**: 全ての開発コマンドは`make`経由でアクセス可能
- **サブディレクトリ対応**: どのディレクトリからでも同じmakeコマンドが使用可能
- **自動化されたヘルプ**: `make help`でコメントベースの自動ヘルプ生成（カテゴリ分け、絵文字付き）
- **色分け表示**: 破壊的コマンドは赤文字で警告表示
- **短縮形サポート**: 頻繁に使うコマンドの短縮形を提供（tf, tb, ti, sd, sb, sf）
- **scriptsディレクトリ呼び出し**: 複雑な処理は`/scripts`配下のスクリプトに委譲
- **シェル安全性**: SHELL, .SHELLFLAGS, .ONESHELLによる堅牢な実行環境

### スクリプト設計原則（実装済み）
- **責務分離**: 開発用スクリプトとアプリ固有コード（backend/scripts）を分離
- **共通化**: `scripts/bin/common.sh`で重複コードを削減
- **保守性**: 仮想環境アクティベート等の複雑な処理を関数化
- **安全性**: 破壊的操作には確認プロンプトを必須とする
- **柔軟性**: 個別ターミナル起動を推奨し、実際の開発スタイルに対応
- **環境の前提条件**: 仮想環境等の自動作成は行わず、適切なセットアップを促す

## 実装済みコマンド体系

### ローカル環境起動
```bash
make start              # 個別ターミナル起動ガイド表示（推奨）
make start-db      (sd) # DynamoDB Local起動
make start-backend (sb) # バックエンドサーバー起動
make start-frontend(sf) # フロントエンド起動
make stop-db            # DynamoDB Local停止
```

### テスト実行
```bash
make test               # 全コンポーネントテスト
make test-frontend (tf) # フロントエンドテストのみ
make test-backend  (tb) # バックエンドテストのみ
make test-infra    (ti) # インフラテストのみ
```

### データベース管理
```bash
make db-start           # DynamoDB Local起動（start-dbのエイリアス）
make db-stop            # DynamoDB Local停止（stop-dbのエイリアス）
make db-init            # データベース統合初期化（テーブル作成 + seedデータ投入）
make db-create-tables   # テーブル作成のみ
make db-seed            # seedデータ投入のみ（テーブル作成をスキップ）
make db-seed-users      # ユーザーseed投入のみ
make db-seed-rulesets   # ルールセットseed投入のみ
make db-recreate        # テーブル再作成（既存テーブルを削除して再作成、破壊的）
make db-clear-data      # テーブルデータのみクリア（テーブル構造は保持、破壊的）
make db-destroy         # DynamoDB Local完全削除（Docker環境破壊、破壊的）
```

### コンテナベースデプロイメント
```bash
make docker-build       # Dockerイメージビルド（backend）
make docker-push        # ECRにイメージプッシュ（backend）
make lambda-update      # Lambda関数コード更新（backend）
make deploy-backend     # 統合デプロイ（build + push + update）
```

### その他
```bash
make setup              # 統合セットアップ（現在はREADME.md参照を案内）
make check              # 開発環境確認
make clean              # 生成物とキャッシュの削除（破壊的）
make help               # コマンド一覧表示
```

### 未実装機能（将来実装予定）
```bash
make db-reset           # データリセット（テーブル削除 + 再作成 + seed投入）
make db-seed-matches    # 対局データseed投入（将来）
make db-seed-venues     # 会場データseed投入（将来）
```

## 実装の特徴

### test.shの良い部分を継承
- **色付き出力**: 視覚的に分かりやすい表示
- **段階的な処理表示**: 何をしているかが明確
- **エラーハンドリング**: 適切なエラーメッセージと解決方法の提示
- **クロスプラットフォーム対応**: Windows/Linux/Mac対応

### 共通関数による効率化
- **`activate_venv()`**: クロスプラットフォーム対応の仮想環境アクティベート
- **`check_directory()`**: ディレクトリ存在チェック
- **`check_node_dependencies()`**: Node.js依存関係チェック
- **`check_python_dependencies()`**: Python依存関係チェック

### 実際の開発スタイルに対応
- **個別ターミナル起動の推奨**: ログの分離とデバッグの容易さ
- **短縮形コマンド**: 高速タイピング用（tf, tb, ti, sd, sb, sf）
- **適切なエラーガイダンス**: 仮想環境がない場合の具体的な解決手順

### backend/scriptsとの棲み分け
- **`/scripts`**: プロジェクト全体で使用される開発支援スクリプト（シェルスクリプト）
- **`backend/scripts/db`**: データベース管理スクリプト（テーブル作成、seedデータ投入）
- **`backend/scripts`**: その他のバックエンド固有スクリプト（認証、マイグレーション等）
- **`backend/seeds`**: テストデータ定義（YAMLファイル）
- **呼び出し方式**: Makefileから`cd backend && python scripts/db/xxx.py`で呼び出し

### データベース管理スクリプトの設計
- **データとロジックの分離**: テストデータはYAMLファイルで管理、スクリプトはロジックのみ
- **責務分離**: テーブル作成、ユーザーseed、ルールセットseedを個別スクリプトに分離
- **統合スクリプト**: `init_db.py`で全ての初期化処理を一括実行
- **環境対応**: local/development環境に対応、production環境は将来実装
- **安全性**: development環境でのテーブル削除には警告、production環境では禁止
- **拡張性**: 新しいseedタイプ（matches, venues等）を追加しやすい設計

## 開発者体験

### 新規開発者向けフロー
1. `make help`でコマンド一覧を確認
2. `make setup`でセットアップガイドを確認（README.md参照）
3. `make start`で個別ターミナル起動ガイドを表示
4. `make check`で環境確認

### 既存開発者向け改善
- **タイピング効率**: 短縮形コマンドで高速操作
- **ディレクトリ非依存**: どのディレクトリからでも同じコマンドが使用可能
- **安定した停止処理**: 適切なサービス停止とクリーンアップ
- **統一されたインターフェース**: 全てのコマンドが`make`経由

## サブディレクトリからのmake実行対応

### 概要
プロジェクトのサブディレクトリ（frontend/backend/infra）からmakeコマンドを実行しても、ルートから実行したものとして動作します。

### 使用例
```bash
# どのディレクトリからでも同じコマンドが使用可能
cd frontend
make start-frontend  # ルートから make start-frontend と同じ動作
make tf              # フロントエンドテスト実行

cd ../backend  
make test-backend    # ルートから make test-backend と同じ動作
make tb              # バックエンドテスト実行

cd ../infra
make test-infra      # ルートから make test-infra と同じ動作
make ti              # インフラテスト実行

# ヘルプも同様に動作
make help            # ルートのMakefileのヘルプが表示される
```

### 実装方式
- **プロジェクトルート検出**: `.root`マーカーファイルでプロジェクトルートを識別
- **動的委譲**: `%:`パターンルールで全てのターゲットを自動委譲
- **軽量実装**: サブディレクトリのMakefileは10行程度の最小実装
- **完全な保守性**: ルートのMakefileにコマンド追加時、サブディレクトリのMakefileは変更不要

### 開発効率の向上
- **コンテキストスイッチ削減**: ディレクトリ移動なしでコマンド実行
- **一貫した操作感**: どこにいても同じコマンドが使用可能
- **保守性**: 新しいコマンド追加時の追加作業なし

## コンテナベースデプロイメント戦略

### 開発フロー
1. **ローカル開発**: `make start-backend`でuvicorn起動
2. **コンテナテスト**: `make docker-build`でローカルビルド・テスト
3. **デプロイ**: `make deploy-backend`で統合デプロイ

### CI/CD統合
- **GitHub Actions**: コミット時の自動ビルド・デプロイ
- **ECRタグ戦略**: コミットハッシュ + `latest`タグ
- **Lambda更新**: `aws lambda update-function-code`による確実な更新

### 問題解決
- **LWA設定問題**: Dockerfileでの明示的なLWA設定

## データベース管理の詳細

### 統合初期化（推奨）

```bash
# local環境（デフォルト）
make db-init

# development環境（テーブル作成をスキップ）
cd backend && python scripts/db/init_db.py --environment development --seeds-only
```

### 個別実行

```bash
# テーブル作成のみ
make db-create-tables
# または
cd backend && python scripts/db/create_tables.py --environment local

# ユーザーseed投入のみ
make db-seed-users
# または
cd backend && python scripts/db/seed_users.py --environment local

# ルールセットseed投入のみ
make db-seed-rulesets
# または
cd backend && python scripts/db/seed_rulesets.py --environment local
```

### データクリアと削除（破壊的操作）

**注意**: これらのコマンドはデータを削除する破壊的操作です。実行前に確認プロンプトが表示されます。

```bash
# テーブルデータのみクリア（テーブル構造は保持、local環境のみ）
make db-clear-data
# または
cd backend && python scripts/db/create_tables.py --environment local --clear-data

# テーブル再作成（既存テーブルを削除して再作成、local環境のみ）
make db-recreate
# または
cd backend && python scripts/db/create_tables.py --environment local --recreate

# DynamoDB Local完全削除（Docker環境破壊）
make db-destroy
```

**各コマンドの違い**:
- `db-clear-data`: テーブル内の全データを削除（テーブル構造は保持）
- `db-recreate`: テーブルを削除して再作成（データとテーブル構造の両方を削除）
- `db-destroy` / `db-clean`: Docker Composeリソースを完全削除（コンテナ、ボリューム、ネットワーク）

### 高度なオプション

```bash
# 既存ユーザーを上書き
cd backend && python scripts/db/seed_users.py --environment local --force

# 既存ルールセットをクリーンアップしてから投入
cd backend && python scripts/db/seed_rulesets.py --environment local --clean

# 確認プロンプトをスキップ（危険）
cd backend && python scripts/db/create_tables.py --environment local --recreate --force
```

### Seedデータファイル

テストデータは `backend/seeds/` ディレクトリのYAMLファイルで管理：

- **users.yaml**: テストユーザーデータ（userId, email, displayName, role）
- **rulesets.yaml**: ルールセット定義（参照用ドキュメント、実際はコードから生成）

新しいseedタイプを追加する場合は、同じパターンでYAMLファイルとスクリプトを追加できます。

## 将来の拡張計画
- **統合セットアップ**: `make setup`の実装（現在はガイド表示のみ）
- **データリセット**: `make db-reset`の実装（テーブル削除 + 再作成 + seed投入）
- **対局データseed**: `make db-seed-matches`の実装
- **会場データseed**: `make db-seed-venues`の実装
- **デプロイ支援**: `make deploy-dev`, `make deploy-prod`の環境別対応
- **開発環境診断**: `make doctor`（環境問題の自動診断）
- **ログ管理**: `make logs`（各サービスのログ表示）

## 関連ドキュメント
- **DEVELOPMENT.md**: 全コマンドの詳細ガイド
- **ADR-0006**: スクリプト配置方針の設計決定
- **README.md**: プロジェクト概要と基本的な使用方法