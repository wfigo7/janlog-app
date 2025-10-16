# Requirements Document

## Introduction

本ドキュメントは、Janlogアプリケーションの継続的インテグレーション（CI）と継続的デプロイメント（CD）の戦略を定義します。現在、CI（テスト）は実装済みですが、CDは手動実行に依存しています。本改善では、GitHub Actionsを活用した自動化されたデプロイメントパイプラインを構築し、開発効率とデプロイの信頼性を向上させます。

一人開発の現状に適した実用的なワークフローを設計し、将来的なチーム開発への移行も考慮した拡張性を持たせます。

## Glossary

- **CI System**: 継続的インテグレーションシステム。コード変更時に自動的にテストを実行するシステム
- **CD System**: 継続的デプロイメントシステム。テスト成功後に自動的にデプロイを実行するシステム
- **GitHub Actions**: GitHubが提供するCI/CDプラットフォーム
- **workflow_dispatch**: GitHub Actionsの手動トリガー機能。UIから任意のタイミングでワークフローを実行可能
- **IAM User**: AWS Identity and Access Managementのユーザーアカウント。アクセスキーとシークレットキーで認証
- **OIDC**: OpenID Connect。一時的な認証トークンを使用するセキュアな認証方式
- **EAS**: Expo Application Services。Expoアプリのビルドと配信を管理するサービス
- **OTA Update**: Over-The-Air Update。アプリストアを経由せずにJavaScriptコードを更新する仕組み
- **Backend System**: FastAPI + Lambda Web Adapterで構築されたバックエンドシステム
- **Infrastructure System**: AWS CDKで管理されるインフラストラクチャ
- **Frontend Web System**: Expo Webでビルドされ、S3 + CloudFrontで配信されるフロントエンドシステム
- **Frontend Mobile System**: Expo + React Nativeで構築されたモバイルアプリケーション
- **development Environment**: 開発・テスト・MVP公開用のAWS環境
- **main Branch**: 日常的な作業用ブランチ。CI（テスト）のみ実行
- **development Branch**: デプロイトリガー用ブランチ。mainからマージされた時点でCD実行

## Requirements

### Requirement 1

**User Story:** 開発者として、developmentブランチへのプッシュ時に手動でデプロイ対象を選択できるようにしたい。これにより、必要なコンポーネントのみをデプロイして時間とコストを節約できる。

#### Acceptance Criteria

1. WHEN 開発者がGitHub ActionsのUIからデプロイワークフローを実行するとき、THE CD System SHALL デプロイ対象（Backend、Infrastructure、Frontend Web）を選択可能なインターフェースを提供する
2. WHEN 開発者がBackendデプロイを選択するとき、THE CD System SHALL Dockerイメージのビルド、ECRへのプッシュ、Lambda関数の更新を実行する
3. WHEN 開発者がInfrastructureデプロイを選択するとき、THE CD System SHALL AWS CDKによるインフラストラクチャのデプロイを実行する
4. WHEN 開発者がFrontend Webデプロイを選択するとき、THE CD System SHALL Expo WebのビルドとS3へのデプロイを実行する
5. WHEN 開発者が複数のコンポーネントを同時に選択するとき、THE CD System SHALL 選択された全てのコンポーネントを並列または順次デプロイする

### Requirement 2

**User Story:** 開発者として、mainブランチを日常的な作業ブランチとして使用し、developmentブランチをデプロイトリガーとして使用したい。これにより、一人開発の現状に適したシンプルなワークフローを実現できる。

#### Acceptance Criteria

1. WHEN 開発者がmainブランチにプッシュするとき、THE CI System SHALL テスト（Frontend、Backend、Infrastructure）のみを実行する
2. WHEN 開発者がdevelopmentブランチにプッシュまたはマージするとき、THE CI System SHALL テストを実行し、成功後にデプロイ可能な状態にする
3. WHEN developmentブランチのテストが成功するとき、THE CD System SHALL 開発者が手動でデプロイを実行できる状態を提供する
4. THE CI System SHALL Pull Request作成時にもテストを実行し、マージ前の品質を保証する
5. THE CI System SHALL テスト失敗時に明確なエラーメッセージとログを提供する

### Requirement 3

**User Story:** 開発者として、既存のMakefileコマンドをGitHub Actions上で再利用したい。これにより、ローカル環境とCI/CD環境で一貫したデプロイ手順を維持できる。

#### Acceptance Criteria

1. THE CD System SHALL バックエンドデプロイ時に`make docker-build`、`make docker-push`、`make lambda-update`コマンドを順次実行する
2. THE CD System SHALL インフラデプロイ時にCDK CLIコマンド（`cdk deploy --context environment=development`）を実行する
3. THE CD System SHALL フロントエンドWebデプロイ時に`make web-build-deploy`コマンドを実行する
4. THE CD System SHALL 各コマンド実行時の標準出力とエラー出力をGitHub Actionsログに記録する
5. THE CD System SHALL コマンド失敗時にワークフローを停止し、エラー状態を明示する

### Requirement 4

**User Story:** 開発者として、AWS認証をセキュアに管理したい。初期段階ではシンプルなIAMユーザー方式で開始し、動作確認後にOIDC方式に移行することで、セキュリティと実装の容易性を両立させたい。

#### Acceptance Criteria

1. THE CD System SHALL Phase 1（初期実装）でIAM Userのアクセスキーとシークレットキーを使用してAWS認証を実行する
2. THE CD System SHALL AWS認証情報をGitHub Secretsに安全に保存し、ワークフロー実行時のみアクセス可能にする
3. THE CD System SHALL Phase 2（セキュリティ強化）でOIDC方式に移行し、一時的な認証トークンを使用する
4. THE CD System SHALL OIDC移行時にIAMロールとトラストポリシーを適切に設定する
5. THE CD System SHALL 認証失敗時に明確なエラーメッセージを提供し、トラブルシューティングを支援する

### Requirement 5

**User Story:** 開発者として、デプロイの成功・失敗を明確に把握したい。これにより、問題発生時に迅速に対応できる。

#### Acceptance Criteria

1. WHEN デプロイワークフローが成功するとき、THE CD System SHALL GitHub ActionsのUIに成功ステータスを表示する
2. WHEN デプロイワークフローが失敗するとき、THE CD System SHALL 失敗したステップとエラーメッセージを明示する
3. THE CD System SHALL 各デプロイステップ（ビルド、プッシュ、更新）の実行時間を記録する
4. THE CD System SHALL デプロイ完了時にデプロイされたコンポーネントとバージョン情報をログに出力する
5. THE CD System SHALL デプロイ失敗時にロールバック手順または復旧方法をログに提示する

### Requirement 6

**User Story:** 開発者として、将来的にモバイルアプリのデプロイ（EAS Update/Build）を追加できる拡張性を持たせたい。現時点ではWeb版のみに集中し、モバイル版は後から段階的に追加できるようにしたい。

#### Acceptance Criteria

1. THE CD System SHALL Phase 1でFrontend Web Systemのデプロイのみをサポートする
2. THE CD System SHALL ワークフロー設計時にFrontend Mobile Systemのデプロイを追加可能な構造を持つ
3. THE CD System SHALL Phase 2でEAS Updateによるモバイルアプリの自動更新をサポートする準備をする
4. THE CD System SHALL EAS関連の認証情報（EXPO_TOKEN）をGitHub Secretsに保存可能にする
5. THE CD System SHALL モバイルデプロイ追加時に既存のWeb版デプロイに影響を与えない

### Requirement 7

**User Story:** 開発者として、デプロイ前に必要な環境変数やシークレットが正しく設定されているか確認したい。これにより、デプロイ失敗のリスクを減らせる。

#### Acceptance Criteria

1. THE CD System SHALL ワークフロー実行前に必要なGitHub Secrets（AWS認証情報）の存在を確認する
2. THE CD System SHALL 環境変数が未設定の場合、明確なエラーメッセージを表示してワークフローを停止する
3. THE CD System SHALL デプロイ対象環境（development）を明示的に指定し、誤った環境へのデプロイを防止する
4. THE CD System SHALL AWS CLIとCDK CLIのバージョンをログに出力し、環境の再現性を確保する
5. THE CD System SHALL デプロイ前にAWS接続テスト（`aws sts get-caller-identity`）を実行し、認証状態を確認する

### Requirement 8

**User Story:** 開発者として、将来的にproduction環境へのデプロイを追加できるようにしたい。現時点ではdevelopment環境のみに集中し、production環境は後から追加できるようにしたい。

#### Acceptance Criteria

1. THE CD System SHALL Phase 1でdevelopment Environmentのみをサポートする
2. THE CD System SHALL ワークフロー設計時に環境パラメータ（environment）を明示的に指定する
3. THE CD System SHALL 将来的にproduction Environmentを追加する際、既存のdevelopment環境デプロイに影響を与えない
4. THE CD System SHALL 環境ごとに異なるAWS認証情報とリソース名を使用可能にする
5. THE CD System SHALL タグベースのバージョン管理（例: v1.0.0タグでproductionデプロイ）を将来的にサポート可能な設計にする
