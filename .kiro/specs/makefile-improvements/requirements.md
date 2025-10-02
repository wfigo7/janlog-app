# Requirements Document

## Introduction

現在のMakefileは基本的な開発コマンドを提供していますが、実務レベルでの堅牢性、保守性、安全性を向上させる必要があります。ChatGPTによるレビューで指摘された問題点を解決し、より実用的で安全なMakefileに改良します。

## Requirements

### Requirement 1: ターゲット定義の一貫性確保

**User Story:** 開発者として、helpに表示されるコマンドと実際のターゲット名が一致していることを期待するので、混乱なくコマンドを実行できる

#### Acceptance Criteria

1. WHEN helpコマンドを実行 THEN 表示されるコマンド名と実際のターゲット名が完全に一致すること
2. WHEN .PHONYディレクティブを確認 THEN 定義されている全てのターゲットが含まれていること
3. IF 未定義のターゲットがhelpに表示されている THEN そのターゲットを実装するか表示から削除すること

### Requirement 2: Docker Compose V2対応

**User Story:** 開発者として、最新のDocker環境で問題なく動作することを期待するので、将来の互換性を確保したい

#### Acceptance Criteria

1. WHEN docker-composeコマンドを使用 THEN docker composeコマンド（V2形式）を使用すること
2. WHEN 全てのdocker-compose呼び出しを確認 THEN ハイフンなしの形式に統一されていること

### Requirement 3: シェル実行の安全性向上

**User Story:** 開発者として、Makefileのレシピ実行中にエラーが適切に検知されることを期待するので、予期しない動作を防ぎたい

#### Acceptance Criteria

1. WHEN Makefileにシェル設定を追加 THEN bashを明示的に指定すること
2. WHEN シェルフラグを設定 THEN -eu -o pipefailオプションを使用すること
3. WHEN .ONESHELLディレクティブを追加 THEN レシピ全体で一貫したシェル環境を使用すること

### Requirement 4: Python仮想環境の適切な処理

**User Story:** 開発者として、Pythonスクリプト実行時に仮想環境が適切にアクティベートされることを期待するので、依存関係の問題を避けたい

#### Acceptance Criteria

1. WHEN Pythonスクリプトを実行 THEN 仮想環境の存在を確認すること
2. IF 仮想環境が存在する THEN 自動的にアクティベートしてからスクリプトを実行すること
3. WHEN 仮想環境が存在しない THEN 適切なエラーメッセージと解決方法を表示すること

### Requirement 5: 破壊的操作の安全性強化

**User Story:** 開発者として、破壊的なクリーンアップ操作が他のプロジェクトに影響しないことを期待するので、安全に作業できる

#### Acceptance Criteria

1. WHEN db-cleanコマンドを実行 THEN プロジェクト固有のリソースのみを削除すること
2. WHEN docker system pruneを使用 THEN 他のプロジェクトのリソースに影響しないよう制限すること
3. WHEN 破壊的操作を実行 THEN ユーザーに明確な警告と確認を求めること

### Requirement 6: ヘルスチェックの信頼性向上

**User Story:** 開発者として、checkコマンドで正確なサービス状態を確認できることを期待するので、開発環境の問題を迅速に特定したい

#### Acceptance Criteria

1. WHEN curlでヘルスチェックを実行 THEN HTTPステータスコードを適切に検証すること
2. WHEN サービスが応答しない THEN 明確なエラーメッセージを表示すること
3. IF 特定のサービスでヘルスチェックが困難 THEN 適切な代替手段または警告を提供すること

### Requirement 7: 自動化されたヘルプ生成

**User Story:** 開発者として、ターゲットの説明が自動的にhelpに反映されることを期待するので、ドキュメントの更新漏れを防ぎたい

#### Acceptance Criteria

1. WHEN 新しいターゲットを追加 THEN コメント形式で説明を記述できること
2. WHEN helpコマンドを実行 THEN コメントから自動的にヘルプテキストが生成されること
3. WHEN カテゴリを定義 THEN ##@コメントでセクション分けができること

### Requirement 8: 追加の便利機能

**User Story:** 開発者として、一般的な開発タスクを効率的に実行できることを期待するので、生産性を向上させたい

#### Acceptance Criteria

1. WHEN cleanコマンドを実行 THEN 生成されたファイルやキャッシュを安全に削除すること
2. WHEN 環境変数ファイルが存在 THEN 自動的に読み込まれること
3. WHEN 短縮コマンドを使用 THEN 対応する完全なコマンドが実行されること

### Requirement 9: エラーハンドリングの改善

**User Story:** 開発者として、コマンド実行時のエラーが明確に報告されることを期待するので、問題を迅速に解決したい

#### Acceptance Criteria

1. WHEN コマンドが失敗 THEN 具体的なエラーメッセージを表示すること
2. WHEN 前提条件が満たされていない THEN 解決方法を含む案内を表示すること
3. WHEN 複数のテストを実行 THEN 個別の結果と全体の結果を明確に表示すること

### Requirement 10: プロジェクト固有の最適化

**User Story:** 開発者として、Janlogプロジェクトの特性に最適化されたMakefileを使用することを期待するので、効率的に開発できる

#### Acceptance Criteria

1. WHEN モノレポ構成を考慮 THEN 各コンポーネント（frontend/backend/infra）の操作が適切に分離されていること
2. WHEN DynamoDB Localを使用 THEN テーブル作成とデータ投入が確実に実行されること
3. WHEN 開発環境の確認を実行 THEN Janlogアプリ固有のエンドポイントとポートを検証すること

### Requirement 11: サブディレクトリからのmake実行対応

**User Story:** 開発者として、プロジェクトのサブディレクトリ（frontend/backend/infra）からmakeコマンドを実行してもルートから実行したものとして動作することを期待するので、どのディレクトリにいても同じコマンドを使用できる

#### Acceptance Criteria

1. WHEN サブディレクトリからmakeコマンドを実行 THEN 自動的にプロジェクトルートディレクトリを検出してそこからコマンドを実行すること
2. WHEN プロジェクトルートが見つからない場合 THEN 適切なエラーメッセージを表示すること
3. WHEN サブディレクトリからmake helpを実行 THEN ルートのMakefileのヘルプが表示されること
4. WHEN 全てのmakeコマンド（start-db, test-backend等）がサブディレクトリから実行 THEN ルートから実行した場合と同じ動作をすること