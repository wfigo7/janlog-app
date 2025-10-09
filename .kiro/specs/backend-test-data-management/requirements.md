# Requirements Document

## Introduction

バックエンドのテストデータ管理を改善し、開発効率とコード品質を向上させる機能です。現在、テストユーザーやルールセットがスクリプトにハードコーディングされており、保守性と拡張性に課題があります。この機能では、テストデータをYAMLファイルで管理し、環境別（local/development）にデータベースを初期化できる仕組みを構築します。

## Requirements

### Requirement 1: Seedデータの外部化

**User Story:** 開発者として、テストデータをコードから分離して管理したい。そうすることで、データの変更が容易になり、可読性が向上する。

#### Acceptance Criteria

1. WHEN 開発者がseedデータを確認する THEN `backend/seeds/`ディレクトリ配下のYAMLファイルでデータを確認できる SHALL
2. WHEN 開発者がユーザーデータを追加・変更する THEN `backend/seeds/users.yaml`を編集するだけで反映できる SHALL
3. WHEN 開発者がseedデータの形式を確認する THEN YAMLファイルに明確な構造とコメントがある SHALL
4. IF 将来的に対局データのseedが必要になった場合 THEN 同じパターンで`matches.yaml`を追加できる SHALL

### Requirement 2: テーブル作成スクリプトの責務分離

**User Story:** 開発者として、テーブル作成とデータ投入を分離して実行したい。そうすることで、必要な操作だけを実行でき、トラブルシューティングが容易になる。

#### Acceptance Criteria

1. WHEN 開発者が`create_tables.py`を実行する THEN テーブル作成のみが実行される SHALL
2. WHEN 開発者がテーブル作成を実行する AND `--environment local`を指定する THEN DynamoDB Localにテーブルが作成される SHALL
3. WHEN 開発者がテーブル作成を実行する AND `--environment development`を指定する THEN AWS DynamoDBへの接続を試みる SHALL
4. WHEN 開発者が`--recreate`オプションを指定する AND local環境である THEN 既存テーブルを削除してから再作成する SHALL
5. WHEN 開発者が`--recreate`オプションを指定する AND development/production環境である THEN エラーメッセージを表示して終了する SHALL
6. WHEN 開発者が`--clear-data`オプションを指定する AND local/development環境である THEN テーブル内の全データを削除する SHALL
7. WHEN 開発者が`--clear-data`オプションを指定する AND production環境である THEN エラーメッセージを表示して終了する SHALL
8. WHEN development環境でテーブルが既に存在する THEN スキップして適切なメッセージを表示する SHALL

### Requirement 3: ユーザーseed投入スクリプト

**User Story:** 開発者として、テストユーザーを簡単に登録したい。そうすることで、開発環境のセットアップが迅速に行える。

#### Acceptance Criteria

1. WHEN 開発者が`seed_users.py`を実行する THEN `backend/seeds/users.yaml`からユーザーデータを読み込む SHALL
2. WHEN ユーザーseedを投入する AND 対象環境を指定する THEN 指定された環境のDynamoDBにユーザーが登録される SHALL
3. WHEN ユーザーseedを投入する AND ユーザーが既に存在する THEN スキップする SHALL
4. WHEN 開発者が`--force`オプションを指定する THEN 既存ユーザーを上書きする SHALL
5. WHEN ユーザーseed投入が完了する THEN 登録されたユーザー数と詳細を表示する SHALL

### Requirement 4: ルールセットseed投入スクリプト

**User Story:** 開発者として、デフォルトのルールセットを簡単に登録したい。そうすることで、テスト時に利用可能なルールセットが常に存在する。

#### Acceptance Criteria

1. WHEN 開発者が`seed_rulesets.py`を実行する THEN `RulesetService.create_default_global_rulesets()`が呼び出される SHALL
2. WHEN ルールセットseedを投入する AND 対象環境を指定する THEN 指定された環境のDynamoDBにルールセットが登録される SHALL
3. WHEN ルールセットseedを投入する AND ルールセットが既に存在する THEN スキップする SHALL
4. WHEN 開発者が`--force`オプションを指定する THEN 既存ルールセットを上書きする SHALL
5. WHEN 開発者が`--clean`オプションを指定する THEN 既存のグローバルルールセット（PK="GLOBAL"）を全て削除してから投入する SHALL
6. WHEN `--clean`オプションを使用する AND ユーザー個人のルールセット（PK="USER#{userId}"）が存在する THEN それらは削除されない SHALL
7. WHEN ルールセットseed投入が完了する THEN 登録されたルールセット数と詳細を表示する SHALL

### Requirement 5: 統合初期化スクリプト

**User Story:** 開発者として、データベースの初期化を一つのコマンドで実行したい。そうすることで、環境セットアップの手順が簡素化される。

#### Acceptance Criteria

1. WHEN 開発者が`init_db.py`を実行する THEN テーブル作成、ユーザーseed投入、ルールセットseed投入が順次実行される SHALL
2. WHEN 統合初期化を実行する AND `--environment`オプションを指定する THEN 指定された環境に対して初期化が実行される SHALL
3. WHEN 統合初期化を実行する AND `--skip-tables`オプションを指定する THEN テーブル作成をスキップする SHALL
4. WHEN 統合初期化を実行する AND `--skip-users`オプションを指定する THEN ユーザーseed投入をスキップする SHALL
5. WHEN 統合初期化を実行する AND `--skip-rulesets`オプションを指定する THEN ルールセットseed投入をスキップする SHALL
6. WHEN 統合初期化を実行する AND `--clean-rulesets`オプションを指定する THEN 既存のグローバルルールセットを削除してから投入する SHALL
7. WHEN いずれかのステップが失敗する THEN エラーメッセージを表示して処理を中断する SHALL
8. WHEN 全てのステップが成功する THEN 成功メッセージと作成されたデータのサマリを表示する SHALL

### Requirement 6: 環境別の動作制御

**User Story:** 開発者として、local環境とdevelopment環境で適切な動作をしてほしい。そうすることで、誤った環境へのデータ投入を防げる。

#### Acceptance Criteria

1. WHEN local環境を指定する THEN DynamoDB Local（http://localhost:8000）に接続する SHALL
2. WHEN development環境を指定する THEN AWS DynamoDB（ap-northeast-1）に接続する SHALL
3. WHEN 環境が指定されない THEN デフォルトでlocal環境として動作する SHALL
4. WHEN development環境でテーブル削除を試みる THEN 警告メッセージを表示して確認を求める SHALL
5. WHEN 環境変数ファイル（.env.local / .env.development）が存在する THEN 適切な設定を読み込む SHALL

### Requirement 7: Makefileコマンドの更新

**User Story:** 開発者として、Makefileから新しいスクリプトを実行したい。そうすることで、統一されたインターフェースで操作できる。

#### Acceptance Criteria

1. WHEN 開発者が`make db-init`を実行する THEN 統合初期化スクリプトが実行される SHALL
2. WHEN 開発者が`make db-create-tables`を実行する THEN テーブル作成スクリプトのみが実行される SHALL
3. WHEN 開発者が`make db-seed`を実行する THEN seedデータ投入のみが実行される SHALL
4. WHEN 開発者が`make db-seed-users`を実行する THEN ユーザーseed投入のみが実行される SHALL
5. WHEN 開発者が`make db-seed-rulesets`を実行する THEN ルールセットseed投入のみが実行される SHALL
6. WHEN 既存の`make db-create-tables`コマンドが実行される THEN 新しい統合初期化スクリプトが呼び出される SHALL

### Requirement 8: 拡張性の確保

**User Story:** 開発者として、将来的に新しいseedタイプを追加できるようにしたい。そうすることで、プロジェクトの成長に対応できる。

#### Acceptance Criteria

1. WHEN 新しいseedタイプ（例: matches）を追加する THEN 同じパターンでYAMLファイルとスクリプトを追加できる SHALL
2. WHEN 新しいseedスクリプトを追加する THEN `init_db.py`に`--skip-{type}`オプションを追加するだけで統合できる SHALL
3. WHEN 新しいseedスクリプトを追加する THEN Makefileに新しいターゲットを追加できる SHALL
4. WHEN スクリプトの共通処理がある THEN 共通ユーティリティ関数として抽出できる SHALL

### Requirement 9: エラーハンドリングとログ出力

**User Story:** 開発者として、スクリプト実行時の状況を把握したい。そうすることで、問題が発生した際に迅速に対応できる。

#### Acceptance Criteria

1. WHEN スクリプトが実行される THEN 実行中のステップが明確に表示される SHALL
2. WHEN データ投入が成功する THEN 成功メッセージと投入されたデータの詳細が表示される SHALL
3. WHEN エラーが発生する THEN エラーメッセージと解決方法のヒントが表示される SHALL
4. WHEN 環境接続に失敗する THEN 接続先と原因を明確に表示する SHALL
5. WHEN YAMLファイルの読み込みに失敗する THEN ファイルパスと原因を表示する SHALL

### Requirement 10: 既存スクリプトのマイグレーション

**User Story:** 開発者として、既存のスクリプトから新しい構造へスムーズに移行したい。そうすることで、既存の機能を壊さずに改善できる。

#### Acceptance Criteria

1. WHEN 既存の`create_local_tables.py`を新しいスクリプトに置き換える THEN 同等の機能が提供される SHALL
2. WHEN 既存の`create_default_rulesets.py`をリネームする THEN `seed_rulesets.py`として機能が継承される SHALL
3. WHEN 既存のMakefileコマンドが実行される THEN 新しいスクリプトが呼び出されるが、動作は互換性がある SHALL
4. WHEN マイグレーション後にテストを実行する THEN 全てのテストが成功する SHALL
