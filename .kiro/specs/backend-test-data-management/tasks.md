# Implementation Plan

- [x] 1. プロジェクト構造のセットアップ
  - `backend/seeds/`ディレクトリを作成
  - `backend/scripts/db/`ディレクトリを作成
  - `backend/scripts/db/__init__.py`を作成
  - _Requirements: 1.1, 2.1_

- [x] 2. Seedデータファイルの作成
  - [x] 2.1 ユーザーseedファイルの作成
    - `backend/seeds/users.yaml`を作成
    - 既存の`create_local_tables.py`からテストユーザーデータを抽出
    - YAML形式でユーザーデータを定義（userId, email, displayName, role）
    - コメントでデータ構造を説明
    - _Requirements: 1.1, 1.2, 3.1_

  - [x] 2.2 ルールセット参照ファイルの作成
    - `backend/seeds/rulesets.yaml`を作成（参照用ドキュメント）
    - `PointCalculator.get_common_rule_templates()`の内容を可視化
    - コメントで実際はコードから生成されることを明記
    - _Requirements: 1.1, 1.3_

- [x] 3. 共通ユーティリティの実装
  - [x] 3.1 スクリプト共通ユーティリティの実装
    - `backend/scripts/db/utils.py`を作成
    - `get_dynamodb_client(environment)`関数を実装（環境別のDynamoDBクライアント取得）
    - `load_env_file(environment)`関数を実装（環境変数ファイル読み込み）
    - `confirm_action(message)`関数を実装（ユーザー確認プロンプト）
    - `print_success()`, `print_error()`, `print_warning()`, `print_info()`関数を実装（色付きメッセージ表示）
    - _Requirements: 2.2, 6.1, 6.2, 9.1, 9.2, 9.3_

  - [ ]* 3.2 ユーティリティ関数のユニットテスト
    - `tests/scripts/test_db_utils.py`を作成
    - 各ユーティリティ関数のテストケースを実装
    - 環境別のDynamoDBクライアント取得をテスト
    - _Requirements: 3.1, 6.1, 6.2_

- [x] 4. テーブル作成スクリプトの実装
  - [x] 4.1 テーブル作成スクリプトの実装
    - `backend/scripts/db/create_tables.py`を作成
    - コマンドライン引数パーサーを実装（--environment, --recreate, --force）
    - `create_table(environment)`関数を実装（テーブル作成）
    - `delete_table(environment)`関数を実装（テーブル削除）
    - `table_exists(environment)`関数を実装（テーブル存在確認）
    - ADR-0002に準拠したテーブル定義（PK, SK, GSI1）
    - development環境での削除時に警告を表示
    - エラーハンドリングと詳細なログ出力
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.4, 9.1, 9.2, 9.3, 9.4_

  - [x] 4.2 テーブル作成スクリプトのテスト
    - local環境でのテーブル作成をテスト
    - テーブル削除→再作成をテスト
    - エラーケースのテスト（接続失敗、権限エラー等）
    - _Requirements: 2.1, 2.2, 6.1_

- [x] 5. ユーザーseed投入スクリプトの実装
  - [x] 5.1 ユーザーseed投入スクリプトの実装
    - `backend/scripts/db/seed_users.py`を作成
    - コマンドライン引数パーサーを実装（--environment, --force, --file）
    - `load_users_from_yaml(file_path)`関数を実装（YAMLファイル読み込み）
    - `seed_user(user_data, environment, force)`関数を実装（ユーザー投入）
    - `user_exists(user_id, environment)`関数を実装（ユーザー存在確認）
    - データ構造のバリデーション（Pydanticモデル使用を検討）
    - 既存ユーザーのスキップ・上書き処理
    - エラーハンドリングと詳細なログ出力
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.5, 9.1, 9.2, 9.3, 9.5_

  - [x] 5.2 ユーザーseed投入スクリプトのテスト
    - YAMLファイル読み込みのテスト
    - ユーザー投入のテスト（新規・上書き）
    - エラーケースのテスト（YAMLパースエラー、データ不正等）
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. ルールセットseed投入スクリプトの実装
  - [x] 6.1 ルールセットseed投入スクリプトの実装
    - `backend/scripts/db/seed_rulesets.py`を作成（既存の`create_default_rulesets.py`をベースに）
    - コマンドライン引数パーサーを実装（--environment, --force, --clean）
    - `seed_rulesets(environment, force, clean)`関数を実装（ルールセット投入）
    - `clean_global_rulesets(environment)`関数を実装（既存グローバルルールセット削除）
    - `ruleset_exists(ruleset_id, environment)`関数を実装（ルールセット存在確認）
    - `RulesetService.create_default_global_rulesets()`を呼び出し
    - 既存ルールセットのスキップ・上書き・クリーン処理
    - エラーハンドリングと詳細なログ出力
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.1, 6.2, 6.5, 9.1, 9.2, 9.3_

  - [x] 6.2 ルールセットseed投入スクリプトのテスト
    - ルールセット投入のテスト（新規・上書き・クリーン）
    - グローバルルールセットのみ削除されることを確認
    - ユーザー個人のルールセットが保持されることを確認
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [x] 7. 統合初期化スクリプトの実装
  - [x] 7.1 統合初期化スクリプトの実装
    - `backend/scripts/db/init_db.py`を作成
    - コマンドライン引数パーサーを実装（--environment, --skip-tables, --skip-users, --skip-rulesets, --force, --clean-rulesets）
    - `init_database()`関数を実装（統合初期化処理）
    - 各スクリプトを順次呼び出し（create_tables, seed_users, seed_rulesets）
    - スキップオプションの処理
    - エラー発生時の処理中断
    - 結果サマリの表示（作成されたテーブル、ユーザー数、ルールセット数）
    - エラーハンドリングと詳細なログ出力
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.5, 9.1, 9.2, 9.3_

  - [ ]* 7.2 統合初期化スクリプトのテスト
    - 全ステップの実行をテスト
    - スキップオプションの動作をテスト
    - エラー発生時の中断をテスト
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 8. Makefileの更新
  - [x] 8.1 新しいMakefileターゲットの追加
    - `db-init`ターゲットを追加（統合初期化スクリプト呼び出し）
    - `db-seed`ターゲットを追加（seedデータ投入のみ、--skip-tablesオプション付き）
    - `db-seed-users`ターゲットを追加（ユーザーseed投入のみ）
    - `db-seed-rulesets`ターゲットを追加（ルールセットseed投入のみ）
    - 各ターゲットに適切な説明コメントを追加
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. 既存スクリプトのマイグレーション
  - [x] 9.1 既存スクリプトの削除
    - `backend/scripts/create_local_tables.py`を削除
    - `backend/scripts/create_default_rulesets.py`を削除（`seed_rulesets.py`に統合済み）
    - _Requirements: 10.1, 10.2_

  - [x] 9.2 動作確認とテスト
    - local環境での初期化をテスト（`make db-init`）
    - 個別スクリプトの実行をテスト（`make db-seed-users`, `make db-seed-rulesets`）
    - 既存のMakefileコマンドの互換性をテスト（`make db-create-tables`）
    - development環境でのseed投入をテスト（テーブル作成スキップ）
    - _Requirements: 10.3, 10.4_

- [x] 10. ドキュメントの更新
  - [x] 10.1 READMEの更新
    - `backend/README.md`に新しいスクリプトの使用方法を追加
    - 環境別の実行例を追加
    - トラブルシューティングセクションを追加
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.2 ステアリングファイルの更新
    - `.kiro/steering/scripts.md`に新しいスクリプトの情報を追加
    - Makefileコマンドの一覧を更新
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
