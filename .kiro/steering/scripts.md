# スクリプト・コマンド体系

## 基本方針（ADR-0006準拠）

### 実装済みディレクトリ構成
```
/
├── Makefile           # 開発コマンドの統一エントリーポイント
├── /scripts           # 開発・運用用スクリプト（主にlocal環境用）
│   ├── bin/           # シェルスクリプト（実行権限付き）
│   │   ├── common.sh       # 共通ユーティリティ関数
│   │   ├── start-runner.sh # 開発環境起動ヘルパー
│   │   └── test-runner.sh  # テスト実行ヘルパー
│   └── python/        # 複雑なPythonスクリプト（現在は空）
├── backend/scripts/   # バックエンド固有スクリプト（そのまま保持）
└── .envrc             # 環境変数定義のみ（aliasなし）
```

### Makefile設計原則（実装済み）
- **実用性重視**: 実際に使用されるコマンドのみ定義
- **統一エントリーポイント**: 全ての開発コマンドは`make`経由でアクセス可能
- **充実したヘルプ**: `make help`で全コマンドの説明を提供（絵文字付き）
- **色分け表示**: 破壊的コマンドは赤文字で警告表示
- **短縮形サポート**: 頻繁に使うコマンドの短縮形を提供（tf, tb, ti, sd, sb, sf）
- **scriptsディレクトリ呼び出し**: 複雑な処理は`/scripts`配下のスクリプトに委譲

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
make stop               # 全サービス停止
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
make db-start           # DynamoDB Local起動
make db-stop            # DynamoDB Local停止
make db-create-tables   # テーブル作成＆初期データセット登録
make db-clean           # Docker環境クリーンアップ（破壊的）
```

### 未実装機能（将来実装予定）
```bash
make setup              # 統合セットアップ（現在はREADME.md参照を案内）
make db-seed            # サンプルデータ投入
make db-reset           # データリセット
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
- **`/scripts`**: プロジェクト全体で使用される開発支援スクリプト
- **`backend/scripts`**: バックエンド固有のスクリプト（認証、マイグレーション等）
- **呼び出し方式**: Makefileから`cd backend && python scripts/xxx.py`で呼び出し

## 開発者体験

### 新規開発者向けフロー
1. `make help`でコマンド一覧を確認
2. `make setup`でセットアップガイドを確認（README.md参照）
3. `make start`で個別ターミナル起動ガイドを表示
4. `make check`で環境確認

### 既存開発者向け改善
- **タイピング効率**: 短縮形コマンドで高速操作
- **安定した停止処理**: 適切なサービス停止とクリーンアップ
- **統一されたインターフェース**: 全てのコマンドが`make`経由

## 将来の拡張計画
- **統合セットアップ**: `make setup`の実装
- **データ管理**: `make db-seed`, `make db-reset`の実装
- **デプロイ支援**: `make deploy-dev`, `make deploy-prod`
- **開発環境診断**: `make doctor`（環境問題の自動診断）
- **ログ管理**: `make logs`（各サービスのログ表示）

## 関連ドキュメント
- **DEVELOPMENT.md**: 全コマンドの詳細ガイド
- **ADR-0006**: スクリプト配置方針の設計決定
- **README.md**: プロジェクト概要と基本的な使用方法