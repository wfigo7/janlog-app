# Design Document

## Overview

本設計書は、Janlogアプリケーションの継続的インテグレーション（CI）と継続的デプロイメント（CD）の実装方針を定義します。既存のCI（テスト）パイプラインを維持しつつ、GitHub Actionsを活用した手動トリガー型のCDパイプラインを追加します。

### 設計原則

1. **段階的実装**: Phase 1でWeb版とバックエンド、Phase 2でモバイル版とOIDC認証
2. **既存資産の活用**: Makefileコマンドを最大限再利用
3. **一人開発に最適化**: 手動トリガー（workflow_dispatch）による柔軟なデプロイ
4. **将来の拡張性**: production環境、モバイルデプロイ、タグベースリリースへの対応
5. **セキュリティ**: GitHub Secretsによる認証情報管理、段階的なOIDC移行

### Phase 1スコープ（本設計の対象）

- Backend System: Docker → ECR → Lambda
- Infrastructure System: AWS CDK deploy
- Frontend Web System: Expo Web → S3 + CloudFront
- AWS認証: IAMユーザー方式
- 対象環境: development環境のみ

### Phase 2スコープ（将来実装）

- Frontend Mobile System: EAS Update（OTA更新）
- AWS認証: OIDC方式への移行
- 対象環境: production環境の追加
- バージョン管理: タグベースのリリース

## Architecture

### ワークフロー全体図

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─── Push to main ───────────────────────────────────┐
             │                                                     │
             │                                              ┌──────▼──────┐
             │                                              │  CI Tests   │
             │                                              │  (Existing) │
             │                                              └─────────────┘
             │
             ├─── Push/Merge to development ─────────────────────┐
             │                                                     │
             │                                              ┌──────▼──────┐
             │                                              │  CI Tests   │
             │                                              └──────┬──────┘
             │                                                     │
             │                                              [Tests Pass]
             │                                                     │
             ├─── Manual Trigger (workflow_dispatch) ─────────────┤
             │                                                     │
             │                                              ┌──────▼──────────────┐
             │                                              │  CD Workflow        │
             │                                              │  (Manual Selection) │
             │                                              └──────┬──────────────┘
             │                                                     │
             │                        ┌────────────────────────────┼────────────────────────────┐
             │                        │                            │                            │
             │                 ┌──────▼──────┐            ┌───────▼────────┐          ┌────────▼────────┐
             │                 │   Backend   │            │ Infrastructure │          │  Frontend Web   │
             │                 │   Deploy    │            │     Deploy     │          │     Deploy      │
             │                 └──────┬──────┘            └───────┬────────┘          └────────┬────────┘
             │                        │                            │                            │
             │                 ┌──────▼──────┐            ┌───────▼────────┐          ┌────────▼────────┐
             │                 │ make        │            │ cdk deploy     │          │ make            │
             │                 │ docker-build│            │ --context      │          │ web-build-deploy│
             │                 │ docker-push │            │ environment=   │          │                 │
             │                 │ lambda-     │            │ development    │          │                 │
             │                 │ update      │            │                │          │                 │
             │                 └──────┬──────┘            └───────┬────────┘          └────────┬────────┘
             │                        │                            │                            │
             │                 ┌──────▼──────┐            ┌───────▼────────┐          ┌────────▼────────┐
             │                 │ ECR + Lambda│            │  AWS Resources │          │ S3 + CloudFront │
             │                 │ (development│            │  (development) │          │  (development)  │
             │                 │ environment)│            │                │          │                 │
             │                 └─────────────┘            └────────────────┘          └─────────────────┘
```

### ブランチ戦略

```
main (作業ブランチ)
  │
  ├─── Push ───> CI Tests (Frontend, Backend, Infra)
  │
  └─── Merge ──> development (デプロイトリガーブランチ)
                    │
                    ├─── Push ───> CI Tests
                    │
                    └─── Manual ──> CD Workflow (workflow_dispatch)
                                      │
                                      └─── Select Components ──> Deploy
```

### GitHub Actions ワークフロー構成

#### 1. CI Workflow（既存、拡張）

- **ファイル**: `.github/workflows/ci.yml`
- **トリガー**: 
  - `push` to `main` or `development`
  - `pull_request` to `main`
- **ジョブ**:
  - `frontend-test`: フロントエンドのテスト、型チェック、Lint
  - `backend-test`: バックエンドのテスト、カバレッジ
  - `infra-test`: インフラのテスト、CDK synth

#### 2. CD Workflow（新規作成）

- **ファイル**: `.github/workflows/cd.yml`
- **トリガー**: `workflow_dispatch`（手動実行）
- **入力パラメータ**:
  - `deploy_backend`: boolean（デフォルト: false）
  - `deploy_infrastructure`: boolean（デフォルト: false）
  - `deploy_frontend_web`: boolean（デフォルト: false）
  - `environment`: choice（development固定、将来production追加）
- **ジョブ**:
  - `deploy-backend`: バックエンドデプロイ（条件付き実行）
  - `deploy-infrastructure`: インフラデプロイ（条件付き実行）
  - `deploy-frontend-web`: フロントエンドWebデプロイ（条件付き実行）

## Components and Interfaces

### 1. Backend Deployment Job

**目的**: FastAPI Lambdaアプリケーションをデプロイ

**実行条件**: `inputs.deploy_backend == true`

**ステップ**:
1. リポジトリチェックアウト
2. AWS認証設定（IAMユーザー方式）
3. AWS CLI接続テスト（`aws sts get-caller-identity`）
4. ECRログイン
5. `make docker-build`: Dockerイメージビルド
6. `make docker-push`: ECRへプッシュ
7. `make lambda-update`: Lambda関数更新
8. デプロイ結果の確認とログ出力

**必要なGitHub Secrets**:
- `AWS_ACCESS_KEY_ID`: IAMユーザーのアクセスキー
- `AWS_SECRET_ACCESS_KEY`: IAMユーザーのシークレットキー
- `AWS_REGION`: デプロイ先リージョン（ap-northeast-1）

**環境変数**:
- `ECR_URI`: ECRリポジトリURI（713209208161.dkr.ecr.ap-northeast-1.amazonaws.com/janlog-api-development）
- `LAMBDA_FUNCTION_NAME`: Lambda関数名（janlog-api-development）

### 2. Infrastructure Deployment Job

**目的**: AWS CDKでインフラストラクチャをデプロイ

**実行条件**: `inputs.deploy_infrastructure == true`

**ステップ**:
1. リポジトリチェックアウト
2. Node.js環境セットアップ（infra/.nvmrc参照）
3. AWS認証設定（IAMユーザー方式）
4. インフラ依存関係インストール（`npm ci`）
5. CDKビルド（`npm run build`）
6. CDK synth（構文チェック）
7. CDKデプロイ（`cdk deploy --context environment=development --require-approval never`）
8. デプロイ結果の確認とログ出力

**必要なGitHub Secrets**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

**環境変数**:
- `ENVIRONMENT`: デプロイ対象環境（development）

### 3. Frontend Web Deployment Job

**目的**: Expo WebアプリをS3 + CloudFrontにデプロイ

**実行条件**: `inputs.deploy_frontend_web == true`

**ステップ**:
1. リポジトリチェックアウト
2. Node.js環境セットアップ（frontend/.nvmrc参照）
3. AWS認証設定（IAMユーザー方式）
4. フロントエンド依存関係インストール（`npm ci`）
5. `make web-build-deploy`: Expo Webビルド + S3デプロイ + CloudFront無効化
6. デプロイ結果の確認とログ出力

**必要なGitHub Secrets**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

**環境変数**:
- `ENVIRONMENT`: デプロイ対象環境（development）

### 4. AWS Authentication（Phase 1: IAMユーザー方式）

**使用アクション**: `aws-actions/configure-aws-credentials@v4`

**設定例**:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ap-northeast-1
```

**必要な権限**:
- ECR: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
- Lambda: `lambda:UpdateFunctionCode`, `lambda:GetFunction`
- S3: `s3:PutObject`, `s3:PutObjectAcl`, `s3:ListBucket`
- CloudFront: `cloudfront:CreateInvalidation`, `cloudfront:GetDistribution`
- CloudFormation: `cloudformation:*`（CDK用）
- IAM: `iam:PassRole`（CDK用）

### 5. AWS Authentication（Phase 2: OIDC方式）

**使用アクション**: `aws-actions/configure-aws-credentials@v4`

**設定例**:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::713209208161:role/GitHubActionsRole
    aws-region: ap-northeast-1
```

**必要な設定**:
1. IAMロール作成（GitHubActionsRole）
2. トラストポリシー設定（GitHub OIDCプロバイダー）
3. 必要な権限ポリシーのアタッチ

## Data Models

### GitHub Actions Workflow Input

```yaml
inputs:
  deploy_backend:
    description: 'Deploy Backend (Docker -> ECR -> Lambda)'
    required: false
    default: false
    type: boolean
  
  deploy_infrastructure:
    description: 'Deploy Infrastructure (AWS CDK)'
    required: false
    default: false
    type: boolean
  
  deploy_frontend_web:
    description: 'Deploy Frontend Web (Expo Web -> S3)'
    required: false
    default: false
    type: boolean
  
  environment:
    description: 'Deployment Environment'
    required: true
    default: 'development'
    type: choice
    options:
      - development
      # - production  # Phase 2で追加
```

### GitHub Secrets

```yaml
# Phase 1: IAMユーザー方式
AWS_ACCESS_KEY_ID: <IAMユーザーのアクセスキー>
AWS_SECRET_ACCESS_KEY: <IAMユーザーのシークレットキー>
AWS_REGION: ap-northeast-1

# Phase 2: 追加予定
EXPO_TOKEN: <EAS CLI認証トークン>
```

### 環境変数マッピング

| コンポーネント | 環境変数 | 値（development） |
|--------------|---------|------------------|
| Backend | ECR_URI | 713209208161.dkr.ecr.ap-northeast-1.amazonaws.com/janlog-api-development |
| Backend | LAMBDA_FUNCTION_NAME | janlog-api-development |
| Infrastructure | ENVIRONMENT | development |
| Frontend Web | ENVIRONMENT | development |

## Error Handling

### 1. AWS認証エラー

**検知方法**: `aws sts get-caller-identity`の実行結果

**エラーメッセージ例**:
```
❌ AWS認証に失敗しました
解決方法:
  1. GitHub SecretsにAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYが設定されているか確認
  2. IAMユーザーの権限を確認
  3. アクセスキーの有効期限を確認
```

**対応**:
- ワークフローを即座に停止
- GitHub Actionsログにエラー詳細を出力
- 開発者にGitHub Secretsの確認を促す

### 2. Dockerビルドエラー

**検知方法**: `make docker-build`の終了コード

**エラーメッセージ例**:
```
❌ Dockerイメージビルドに失敗しました
解決方法:
  1. backend/Dockerfileの構文を確認
  2. backend/requirements.txtの依存関係を確認
  3. ローカルで`make docker-build`を実行して再現
```

**対応**:
- ワークフローを停止
- ビルドログをGitHub Actionsに出力
- ローカルでの再現手順を提示

### 3. ECRプッシュエラー

**検知方法**: `make docker-push`の終了コード

**エラーメッセージ例**:
```
❌ ECRへのイメージプッシュに失敗しました
解決方法:
  1. ECRリポジトリが存在することを確認
  2. IAMユーザーにECR権限があることを確認
  3. ECRログインが成功していることを確認
```

**対応**:
- ワークフローを停止
- ECRログインログとプッシュログを出力
- IAM権限の確認手順を提示

### 4. Lambda更新エラー

**検知方法**: `make lambda-update`の終了コード

**エラーメッセージ例**:
```
❌ Lambda関数の更新に失敗しました
解決方法:
  1. Lambda関数が存在することを確認
  2. IAMユーザーにLambda更新権限があることを確認
  3. ECRイメージが正常にプッシュされていることを確認
```

**対応**:
- ワークフローを停止
- Lambda更新ログを出力
- ロールバック手順を提示（前回のイメージタグを使用）

### 5. CDKデプロイエラー

**検知方法**: `cdk deploy`の終了コード

**エラーメッセージ例**:
```
❌ CDKデプロイに失敗しました
解決方法:
  1. CDK synthが成功することを確認
  2. CloudFormationスタックの状態を確認
  3. IAMユーザーにCloudFormation権限があることを確認
```

**対応**:
- ワークフローを停止
- CDKエラーログを出力
- CloudFormationコンソールでスタック状態を確認する手順を提示

### 6. S3デプロイエラー

**検知方法**: `make web-build-deploy`の終了コード

**エラーメッセージ例**:
```
❌ S3へのデプロイに失敗しました
解決方法:
  1. S3バケットが存在することを確認
  2. IAMユーザーにS3書き込み権限があることを確認
  3. CloudFront Distribution IDが正しいことを確認
```

**対応**:
- ワークフローを停止
- S3アップロードログとCloudFront無効化ログを出力
- 手動デプロイ手順を提示

### 7. 環境変数未設定エラー

**検知方法**: ワークフロー開始時のバリデーション

**エラーメッセージ例**:
```
❌ 必要な環境変数が設定されていません
不足している変数: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
解決方法:
  1. GitHub Settings > Secrets and variables > Actions に移動
  2. 必要なSecretsを追加
```

**対応**:
- ワークフローを即座に停止
- 不足しているSecretsのリストを表示
- GitHub Secretsの設定手順を提示

## Testing Strategy

### 1. ワークフロー構文テスト

**方法**: GitHub Actionsのワークフロー構文チェック

**実行タイミング**: ワークフローファイル変更時

**検証項目**:
- YAML構文の正当性
- 必要なキーの存在
- 入力パラメータの型

### 2. ローカルでのMakefileコマンドテスト

**方法**: ローカル環境で各Makefileコマンドを実行

**実行タイミング**: ワークフロー実装前

**検証項目**:
- `make docker-build`の成功
- `make docker-push`の成功（AWS認証情報設定済み）
- `make lambda-update`の成功
- `make web-build-deploy`の成功

### 3. GitHub Actions実行テスト

**方法**: 実際にGitHub Actionsでワークフローを実行

**実行タイミング**: ワークフロー実装後

**検証項目**:
- workflow_dispatchトリガーの動作
- 入力パラメータの受け取り
- 条件付きジョブ実行
- AWS認証の成功
- 各デプロイコマンドの成功
- エラーハンドリングの動作

### 4. デプロイ結果の検証

**方法**: デプロイ後のリソース確認

**実行タイミング**: デプロイ完了後

**検証項目**:
- Backend: Lambda関数のイメージURIが更新されていること
- Infrastructure: CloudFormationスタックが正常にデプロイされていること
- Frontend Web: S3バケットにファイルがアップロードされ、CloudFrontキャッシュが無効化されていること

### 5. ロールバックテスト

**方法**: デプロイ失敗時のロールバック手順を実行

**実行タイミング**: エラーハンドリング実装後

**検証項目**:
- Backend: 前回のECRイメージタグでLambda関数を更新できること
- Infrastructure: CloudFormationスタックをロールバックできること
- Frontend Web: 前回のS3バケット内容を復元できること

## Implementation Plan

### Phase 1: 基本的なCDパイプライン構築

#### Step 1: GitHub Secretsの設定

1. IAMユーザーの作成（または既存ユーザーの使用）
2. 必要な権限ポリシーのアタッチ
3. アクセスキーとシークレットキーの生成
4. GitHub Secretsへの登録
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

#### Step 2: CDワークフローファイルの作成

1. `.github/workflows/cd.yml`の作成
2. workflow_dispatchトリガーの設定
3. 入力パラメータの定義
4. 共通ステップの実装（チェックアウト、AWS認証）

#### Step 3: Backend Deployment Jobの実装

1. 条件付き実行の設定
2. AWS認証ステップの追加
3. Makefileコマンド実行ステップの追加
4. エラーハンドリングの実装

#### Step 4: Infrastructure Deployment Jobの実装

1. 条件付き実行の設定
2. Node.js環境セットアップ
3. CDKコマンド実行ステップの追加
4. エラーハンドリングの実装

#### Step 5: Frontend Web Deployment Jobの実装

1. 条件付き実行の設定
2. Node.js環境セットアップ
3. Makefileコマンド実行ステップの追加
4. エラーハンドリングの実装

#### Step 6: テストとデバッグ

1. 各ジョブの個別テスト
2. 複数ジョブの同時実行テスト
3. エラーケースのテスト
4. ログ出力の確認

### Phase 2: セキュリティ強化とモバイル対応

#### Step 1: OIDC認証への移行

1. IAMロールの作成
2. GitHub OIDCプロバイダーの設定
3. トラストポリシーの設定
4. ワークフローの更新（IAMユーザー → OIDC）
5. 動作確認とIAMユーザーの削除

#### Step 2: EAS Update対応

1. `EXPO_TOKEN`のGitHub Secretsへの登録
2. Frontend Mobile Deployment Jobの追加
3. EAS Update実行ステップの実装
4. テストとデバッグ

#### Step 3: Production環境対応

1. production環境用のAWSリソース作成
2. 環境別のGitHub Secrets設定
3. ワークフロー入力パラメータにproduction追加
4. タグベースのデプロイトリガー実装

## Design Decisions

### 1. 手動トリガー（workflow_dispatch）の採用

**理由**:
- 一人開発のため、頻繁なデプロイは不要
- デプロイタイミングを開発者が完全にコントロール可能
- デプロイ対象を柔軟に選択可能（コスト削減）

**トレードオフ**:
- 自動デプロイと比較して手動操作が必要
- デプロイ忘れのリスク

**代替案**:
- developmentブランチへのプッシュで自動デプロイ
- コミットメッセージベースの選択的デプロイ

### 2. Makefileコマンドの再利用

**理由**:
- ローカル環境とCI/CD環境で一貫したデプロイ手順
- 既存のMakefileが十分に整備されている
- デバッグが容易（ローカルで再現可能）

**トレードオフ**:
- GitHub Actions固有の最適化が難しい
- Makefileの変更がCI/CDに影響

**代替案**:
- GitHub Actions内で直接コマンドを実行
- カスタムアクションの作成

### 3. IAMユーザー → OIDC の段階的移行

**理由**:
- 初期実装の複雑さを軽減
- 動作確認後にセキュリティ強化
- OIDCの学習コストを分散

**トレードオフ**:
- Phase 1でのセキュリティリスク（アクセスキー漏洩）
- 2段階の実装が必要

**代替案**:
- 最初からOIDC方式を採用

### 4. Web版優先、モバイル版は後回し

**理由**:
- Web版デプロイが比較的シンプル
- EASの学習コストが高い
- MVP段階ではWeb版で十分

**トレードオフ**:
- モバイルアプリのデプロイは手動のまま
- Phase 2での追加実装が必要

**代替案**:
- 最初からEAS Updateを実装

### 5. development環境のみ対応

**理由**:
- 現時点でproduction環境が存在しない
- MVP段階ではdevelopment環境で十分
- 将来の拡張性を考慮した設計

**トレードオフ**:
- production環境追加時に追加実装が必要

**代替案**:
- 最初からproduction環境を想定した設計

## Security Considerations

### 1. GitHub Secretsの管理

- アクセスキーとシークレットキーは絶対にコードにコミットしない
- GitHub Secretsは暗号化されて保存される
- ワークフロー実行時のみアクセス可能
- ログにSecrets値が出力されないようマスキング

### 2. IAMユーザーの権限

- 最小権限の原則に従う
- デプロイに必要な権限のみを付与
- 定期的な権限レビュー
- アクセスキーのローテーション

### 3. OIDC移行後のセキュリティ

- 一時的な認証トークンを使用
- アクセスキーの漏洩リスクを排除
- GitHub ActionsとAWSの信頼関係を明示的に設定
- トラストポリシーでリポジトリとブランチを制限

### 4. デプロイログの管理

- 機密情報（認証情報、APIキー）をログに出力しない
- GitHub Actionsの自動マスキング機能を活用
- ログの保持期間を適切に設定

## Monitoring and Logging

### 1. GitHub Actionsログ

- 各ステップの実行時間を記録
- コマンドの標準出力とエラー出力を記録
- デプロイ成功・失敗の明確な表示
- エラー時のトラブルシューティング情報

### 2. AWS CloudWatch Logs

- Lambda関数のログ
- CloudFormationスタックのイベント
- S3アクセスログ
- CloudFrontアクセスログ

### 3. デプロイ履歴

- GitHub Actionsの実行履歴
- デプロイ日時とトリガー
- デプロイ対象コンポーネント
- デプロイ結果（成功・失敗）

## Future Enhancements

### 1. Slack通知

- デプロイ成功・失敗をSlackに通知
- GitHub Actionsの通知アクションを使用

### 2. デプロイ承認フロー

- production環境デプロイ時に承認を要求
- GitHub Environmentsの承認機能を使用

### 3. ロールバック自動化

- デプロイ失敗時の自動ロールバック
- 前回のデプロイ状態を保存

### 4. パフォーマンス最適化

- キャッシュの活用（npm、pip）
- 並列実行の最適化
- 不要なステップのスキップ

### 5. タグベースリリース

- Gitタグ作成時に自動デプロイ
- セマンティックバージョニング
- リリースノートの自