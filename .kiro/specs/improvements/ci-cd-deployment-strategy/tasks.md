# Implementation Plan

このタスクリストは、CI/CDデプロイメント戦略の実装を段階的に進めるためのものです。Phase 1では基本的なCDパイプラインを構築し、Phase 2でセキュリティ強化とモバイル対応を行います。

## Phase 1: 基本的なCDパイプライン構築

- [x] 1. AWS IAMユーザーとGitHub Secretsの設定
  - IAMユーザーを作成または既存ユーザーを使用し、必要な権限を付与
  - GitHub Secretsに認証情報を登録
  - _Requirements: 4.1, 4.2, 7.1, 7.2_

- [x] 1.1 IAMユーザーの作成と権限設定
  - AWSコンソールまたはCLIでIAMユーザーを作成
  - 必要な権限ポリシーをアタッチ（ECR、Lambda、S3、CloudFront、CloudFormation、IAM）
  - アクセスキーとシークレットキーを生成
  - _Requirements: 4.1, 4.2_

- [x] 1.2 GitHub Secretsへの認証情報登録
  - GitHubリポジトリのSettings > Secrets and variables > Actionsに移動
  - `AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_REGION`を登録
  - Secretsが正しく登録されたことを確認
  - _Requirements: 4.2, 7.1_

- [x] 2. CDワークフローファイルの基本構造作成
  - `.github/workflows/cd.yml`ファイルを作成
  - workflow_dispatchトリガーと入力パラメータを定義
  - 共通ステップ（チェックアウト、AWS認証）を実装
  - _Requirements: 1.1, 2.3, 4.1_

- [x] 2.1 ワークフローファイルの作成と基本設定
  - `.github/workflows/cd.yml`を作成
  - workflow_dispatchトリガーを設定
  - 入力パラメータ（deploy_backend、deploy_infrastructure、deploy_frontend_web、environment）を定義
  - _Requirements: 1.1, 2.3_

- [x] 2.2 共通ステップの実装
  - リポジトリチェックアウトステップを追加
  - AWS認証ステップを追加（aws-actions/configure-aws-credentials@v4）
  - AWS接続テストステップを追加（aws sts get-caller-identity）
  - _Requirements: 4.1, 7.5_

- [x] 3. Backend Deployment Jobの実装
  - バックエンドデプロイジョブを作成
  - Makefileコマンドを使用してDocker → ECR → Lambdaのデプロイを実行
  - エラーハンドリングを実装
  - _Requirements: 1.2, 3.1, 5.1, 5.2_

- [x] 3.1 Backend Deployment Jobの基本構造作成
  - `deploy-backend`ジョブを作成
  - 条件付き実行を設定（inputs.deploy_backend == true）
  - 必要な環境変数を設定（ECR_URI、LAMBDA_FUNCTION_NAME）
  - _Requirements: 1.2, 3.1_

- [x] 3.2 Dockerビルドとプッシュステップの実装
  - ECRログインステップを追加
  - `make docker-build`ステップを追加
  - `make docker-push`ステップを追加
  - 各ステップのエラーハンドリングを実装
  - _Requirements: 3.1, 5.2_

- [x] 3.3 Lambda関数更新ステップの実装
  - `make lambda-update`ステップを追加
  - Lambda関数の状態確認ステップを追加
  - デプロイ結果のログ出力を実装
  - _Requirements: 3.1, 5.4_

- [x] 4. Infrastructure Deployment Jobの実装
  - インフラデプロイジョブを作成
  - CDKコマンドを使用してインフラをデプロイ
  - エラーハンドリングを実装
  - _Requirements: 1.3, 3.2, 5.1, 5.2_

- [x] 4.1 Infrastructure Deployment Jobの基本構造作成
  - `deploy-infrastructure`ジョブを作成
  - 条件付き実行を設定（inputs.deploy_infrastructure == true）
  - Node.js環境セットアップステップを追加（infra/.nvmrc参照）
  - _Requirements: 1.3, 3.2_

- [x] 4.2 CDKデプロイステップの実装
  - インフラ依存関係インストールステップを追加（npm ci）
  - CDKビルドステップを追加（npm run build）
  - CDK synthステップを追加（構文チェック）
  - CDKデプロイステップを追加（cdk deploy --context environment=development --require-approval never）
  - _Requirements: 3.2, 5.2_

- [x] 4.3 デプロイ結果の確認とログ出力
  - CloudFormationスタックの状態確認ステップを追加
  - デプロイ結果のログ出力を実装
  - エラー時のトラブルシューティング情報を出力
  - _Requirements: 5.4, 5.5_

- [x] 5. Frontend Web Deployment Jobの実装
  - フロントエンドWebデプロイジョブを作成
  - Makefileコマンドを使用してExpo Web → S3のデプロイを実行
  - エラーハンドリングを実装
  - _Requirements: 1.4, 3.3, 5.1, 5.2_

- [x] 5.1 Frontend Web Deployment Jobの基本構造作成
  - `deploy-frontend-web`ジョブを作成
  - 条件付き実行を設定（inputs.deploy_frontend_web == true）
  - Node.js環境セットアップステップを追加（frontend/.nvmrc参照）
  - _Requirements: 1.4, 3.3_

- [x] 5.2 Expo WebビルドとS3デプロイステップの実装
  - フロントエンド依存関係インストールステップを追加（npm ci）
  - `make web-build-deploy`ステップを追加
  - デプロイ結果のログ出力を実装
  - _Requirements: 3.3, 5.2_

- [x] 5.3 CloudFrontキャッシュ無効化の確認
  - CloudFront無効化が正常に実行されたことを確認
  - 無効化の進行状況をログに出力
  - エラー時のトラブルシューティング情報を出力
  - _Requirements: 5.4, 5.5_

- [x] 6. エラーハンドリングとログ出力の強化
  - 各ジョブのエラーハンドリングを強化
  - デプロイ成功・失敗の明確な表示を実装
  - トラブルシューティング情報を充実
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.1 AWS認証エラーのハンドリング
  - AWS認証失敗時のエラーメッセージを実装
  - GitHub Secretsの確認手順を出力
  - IAMユーザー権限の確認手順を出力
  - _Requirements: 5.2, 7.2_

- [ ]* 6.2 デプロイコマンドエラーのハンドリング
  - 各Makefileコマンド失敗時のエラーメッセージを実装
  - ローカルでの再現手順を出力
  - ロールバック手順を出力
  - _Requirements: 5.2, 5.5_

- [ ]* 6.3 デプロイ結果の可視化
  - デプロイ成功時のサマリーを出力
  - デプロイされたコンポーネントとバージョン情報を出力
  - 実行時間を記録
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 7. ワークフローのテストとデバッグ
  - 各ジョブを個別にテスト
  - 複数ジョブの同時実行をテスト
  - エラーケースをテスト
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7.1 Backend Deployment Jobのテスト
  - workflow_dispatchでBackendのみを選択して実行
  - デプロイ成功を確認
  - Lambda関数のイメージURIが更新されたことを確認
  - _Requirements: 1.2, 3.1_

- [x] 7.2 Infrastructure Deployment Jobのテスト
  - workflow_dispatchでInfrastructureのみを選択して実行
  - デプロイ成功を確認
  - CloudFormationスタックが正常にデプロイされたことを確認
  - _Requirements: 1.3, 3.2_

- [x] 7.3 Frontend Web Deployment Jobのテスト
  - workflow_dispatchでFrontend Webのみを選択して実行
  - デプロイ成功を確認
  - S3バケットにファイルがアップロードされたことを確認
  - CloudFrontキャッシュが無効化されたことを確認
  - _Requirements: 1.4, 3.3_

- [x] 7.4 複数ジョブの同時実行テスト
  - workflow_dispatchで複数のコンポーネントを選択して実行
  - 全てのジョブが正常に実行されることを確認
  - ジョブ間の依存関係がないことを確認
  - _Requirements: 1.5_

- [ ]* 7.5 エラーケースのテスト
  - AWS認証エラーをシミュレート（無効なSecrets）
  - Dockerビルドエラーをシミュレート（Dockerfile構文エラー）
  - CDKデプロイエラーをシミュレート（無効なスタック）
  - エラーメッセージとトラブルシューティング情報が正しく表示されることを確認
  - _Requirements: 5.2, 5.5_

- [x] 8. ドキュメントの更新
  - README.mdにCI/CDの使用方法を追加
  - デプロイ手順を文書化
  - トラブルシューティングガイドを作成
  - _Requirements: 5.5_

- [x] 8.1 README.mdの更新
  - CI/CDセクションを追加
  - workflow_dispatchの使用方法を説明
  - 各デプロイオプションの説明を追加
  - _Requirements: 5.5_

- [x] 8.2 デプロイ手順の文書化
  - GitHub Secretsの設定手順を文書化
  - 各コンポーネントのデプロイ手順を文書化
  - デプロイ前の確認事項を文書化
  - _Requirements: 7.1, 7.2_

- [x] 8.3 トラブルシューティングガイドの作成
  - よくあるエラーと解決方法を文書化
  - ロールバック手順を文書化
  - 問い合わせ先を明記
  - _Requirements: 5.5_

## Phase 2: セキュリティ強化とモバイル対応（将来実装）

- [x] 9. OIDC認証への移行
  - IAMロールを作成
  - GitHub OIDCプロバイダーを設定
  - ワークフローをOIDC方式に更新
  - _Requirements: 4.3, 4.4_

- [x] 9.1 IAMロールとOIDCプロバイダーの設定
  - IAMロール（GitHubActionsRole）を作成
  - GitHub OIDCプロバイダーをAWSに登録
  - トラストポリシーを設定（リポジトリとブランチを制限）
  - 必要な権限ポリシーをアタッチ
  - _Requirements: 4.3, 4.4_

- [x] 9.2 ワークフローのOIDC方式への更新
  - AWS認証ステップをOIDC方式に変更
  - role-to-assumeパラメータを設定
  - GitHub Secretsから不要なアクセスキーを削除
  - _Requirements: 4.3_

- [x] 9.3 OIDC認証のテスト
  - 各デプロイジョブでOIDC認証が成功することを確認
  - IAMユーザーのアクセスキーを無効化
  - セキュリティが向上したことを確認
  - _Requirements: 4.3, 4.4_

- [ ] 10. EAS Build対応（モバイルアプリビルド）
  - EXPO_TOKENをGitHub Secretsに登録
  - Frontend Mobile Build Jobを追加
  - EAS Build実行ステップを実装
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 10.1 EXPO_TOKENの取得と登録



  - EAS CLIでログイン（eas login）
  - EXPO_TOKENを生成（eas whoami --json）
  - GitHub Secretsに登録
  - _Requirements: 6.4_


- [x] 10.2 Frontend Mobile Build Jobの実装

  - `build-frontend-mobile`ジョブを作成
  - 条件付き実行を設定（inputs.build_frontend_mobile == true）
  - Node.js環境セットアップステップを追加
  - _Requirements: 6.2, 6.3_


- [x] 10.3 EAS Buildステップの実装

  - フロントエンド依存関係インストールステップを追加
  - EAS Build実行ステップを追加（eas build --platform android --non-interactive）
  - ビルド結果のログ出力を実装（artifact URL、ビルドID等）
  - _Requirements: 6.3_

- [ ]* 10.4 EAS Buildのテスト
  - workflow_dispatchでFrontend Mobileを選択して実行
  - EAS Buildが成功することを確認
  - Expoアカウントにartifactが追加されたことを確認
  - _Requirements: 6.3_

- [ ] 11. Production環境対応
  - production環境用のAWSリソースを作成
  - 環境別のGitHub Secretsを設定
  - ワークフロー入力パラメータにproductionを追加
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11.1 Production環境のAWSリソース作成
  - CDKでproduction環境のスタックをデプロイ
  - production環境用のECRリポジトリ、Lambda関数、S3バケット、CloudFront Distributionを作成
  - リソース名に`-production`サフィックスを付与
  - _Requirements: 8.2, 8.4_

- [ ] 11.2 Production環境用のGitHub Secrets設定
  - production環境用のIAMユーザーまたはIAMロールを作成
  - GitHub Secretsに`AWS_ACCESS_KEY_ID_PROD`、`AWS_SECRET_ACCESS_KEY_PROD`を登録（またはOIDCロールARN）
  - 環境別のSecrets管理方法を文書化
  - _Requirements: 8.4_

- [ ] 11.3 ワークフロー入力パラメータの拡張
  - environmentパラメータにproductionオプションを追加
  - 環境別の条件分岐を実装
  - production環境デプロイ時の追加確認を実装
  - _Requirements: 8.2, 8.3_

- [ ]* 11.4 Production環境デプロイのテスト
  - workflow_dispatchでproduction環境を選択して実行
  - 各コンポーネントが正常にデプロイされることを確認
  - development環境に影響がないことを確認
  - _Requirements: 8.3_

- [ ] 12. タグベースリリースの実装
  - Gitタグ作成時に自動デプロイするワークフローを追加
  - セマンティックバージョニングを適用
  - リリースノートの自動生成を実装
  - _Requirements: 8.5_

- [ ] 12.1 タグトリガーワークフローの作成
  - `.github/workflows/release.yml`を作成
  - タグプッシュ時のトリガーを設定（on: push: tags: ['v*']）
  - タグからバージョン番号を抽出
  - _Requirements: 8.5_

- [ ] 12.2 タグベースデプロイの実装
  - production環境への自動デプロイを実装
  - バージョン番号をECRイメージタグに使用
  - デプロイ結果をGitHub Releaseに記録
  - _Requirements: 8.5_

- [ ]* 12.3 リリースノートの自動生成
  - 前回のタグからの変更履歴を取得
  - コミットメッセージからリリースノートを生成
  - GitHub Releaseに自動投稿
  - _Requirements: 8.5_

- [ ] 13. EAS Update対応（モバイルアプリOTA更新）
  - Frontend Mobile Update Jobを追加
  - EAS Update実行ステップを実装
  - _Requirements: 6.2, 6.3_

- [ ] 13.1 Frontend Mobile Update Jobの実装
  - `update-frontend-mobile`ジョブを作成
  - 条件付き実行を設定（inputs.update_frontend_mobile == true）
  - Node.js環境セットアップステップを追加
  - _Requirements: 6.2, 6.3_

- [ ] 13.2 EAS Updateステップの実装
  - フロントエンド依存関係インストールステップを追加
  - EAS Update実行ステップを追加（eas update --branch development --message "..."）
  - 更新結果のログ出力を実装
  - _Requirements: 6.3_

- [ ]* 13.3 EAS Updateのテスト
  - workflow_dispatchでFrontend Mobile Updateを選択して実行
  - EAS Updateが成功することを確認
  - モバイルアプリで更新が反映されることを確認
  - _Requirements: 6.3_

## 注意事項

- Phase 1のタスクを完了してから、Phase 2に進むこと
- 各タスクは順番に実行し、前のタスクが完了してから次に進むこと
- テストタスク（*付き）は任意だが、実行を推奨
- エラーが発生した場合は、エラーメッセージとログを確認してトラブルシューティングを行うこと
- GitHub Secretsの設定は慎重に行い、誤って公開しないこと
