# CI/CDデプロイメントガイド

このドキュメントでは、GitHub Actionsを使用したCI/CDパイプラインの詳細な使用方法を説明します。

## 目次

- [概要](#概要)
- [AWS認証の設定（OIDC）](#aws認証の設定oidc)
- [デプロイ手順](#デプロイ手順)
- [各コンポーネントのデプロイ詳細](#各コンポーネントのデプロイ詳細)
- [デプロイ前の確認事項](#デプロイ前の確認事項)
- [トラブルシューティング](#トラブルシューティング)

## 概要

Janlogプロジェクトでは、以下の3つのコンポーネントを独立してデプロイできます：

1. **Backend**: FastAPIアプリケーション（Docker → ECR → Lambda）
2. **Infrastructure**: AWSインフラストラクチャ（AWS CDK）
3. **Frontend Web**: Expo Webアプリケーション（S3 + CloudFront）

各コンポーネントは個別にデプロイすることも、複数を同時にデプロイすることも可能です。

### 認証方式

このプロジェクトでは、**OIDC（OpenID Connect）認証**を使用してGitHub ActionsからAWSにアクセスします。

**OIDCのメリット**:
- 長期的なアクセスキーの管理が不要
- 一時的な認証情報のみ使用
- セキュリティリスクの低減
- CloudTrailでの追跡が容易
- GitHub Secretsの管理が不要

### リソース構成

CDKで複数の環境（development、production）をデプロイした場合、以下のリソースが作成されます：

- **OIDCプロバイダー（共通）**: `arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com`
  - AWSアカウント内で1つのみ作成
  - 全ての環境で共有
  - development環境のデプロイ時に作成

- **IAMロール（環境ごと）**:
  - `janlog-github-actions-development` - development環境用
  - `janlog-github-actions-production` - production環境用（将来）
  - 各環境で独立した権限を持つ

## AWS認証の設定（OIDC）

### ステップ1: CDKでOIDCスタックをデプロイ

GitHub OIDC用のIAMロールとOIDCプロバイダーを作成します。

```bash
# infraディレクトリに移動
cd infra

# 依存関係をインストール（初回のみ）
npm ci

# CDKプロジェクトをビルド
npm run build

# CDK synthで構文チェック
npm run synth -- --context environment=development

# OIDCスタックをデプロイ
npm run deploy -- --context environment=development JanlogGitHubOidcStack-development
```

デプロイが成功すると、以下の出力が表示されます：

```
Outputs:
JanlogGitHubOidcStack-development.GitHubActionsRoleArn = arn:aws:iam::713209208161:role/janlog-github-actions-development
```

### ステップ2: リソースの確認

作成されたリソースを確認します：

```bash
# OIDCプロバイダーの確認
aws iam list-open-id-connect-providers

# IAMロールの確認
aws iam get-role --role-name janlog-github-actions-development
```

### ステップ3: GitHub Actionsワークフローの確認

`.github/workflows/cd.yml`は既にOIDC方式で設定されています。

**主要な設定**:

```yaml
env:
  AWS_REGION: ap-northeast-1
  ENVIRONMENT: ${{ inputs.environment }}
  AWS_ROLE_ARN: arn:aws:iam::713209208161:role/janlog-github-actions-${{ inputs.environment }}

jobs:
  deploy-backend:
    permissions:
      id-token: write  # OIDC認証に必要
      contents: read
    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ env.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Backend-${{ github.run_id }}
```

**重要なポイント**:
- `permissions`で`id-token: write`を設定（OIDC認証に必須）
- `role-to-assume`でIAMロールARNを指定
- `role-session-name`でセッション名を指定（CloudTrailでの追跡用）
- GitHub Secretsは不要

### IAMロールの権限

作成されたIAMロールには、以下の権限が付与されています：

**Backend デプロイ用**:
- ECR: イメージのプッシュ・取得
- Lambda: 関数コードの更新

**Infrastructure デプロイ用**:
- CloudFormation: スタックのデプロイ
- IAM: ロールの作成・管理
- S3: バケットの作成・管理
- Cognito: User Poolの作成・管理
- API Gateway: APIの作成・管理
- Lambda: 関数の作成・管理
- ECR: リポジトリの作成・管理
- CloudFront: Distributionの作成・管理

**Frontend Web デプロイ用**:
- S3: ファイルのアップロード
- CloudFront: キャッシュ無効化

詳細な権限リストは`infra/lib/stacks/github-oidc-stack.ts`を参照してください。

## デプロイ手順

### 基本的なデプロイフロー

1. **GitHubリポジトリのActionsタブに移動**
   - リポジトリページの上部にある **Actions** タブをクリック

2. **CD Pipelineワークフローを選択**
   - 左サイドバーから **CD Pipeline** を選択

3. **Run workflowボタンをクリック**
   - 右上の **Run workflow** ボタンをクリック

4. **デプロイオプションを選択**
   - **Deploy Backend**: バックエンドをデプロイする場合はチェック
   - **Deploy Infrastructure**: インフラをデプロイする場合はチェック
   - **Deploy Frontend Web**: フロントエンドWebをデプロイする場合はチェック
   - **Environment**: デプロイ環境を選択（現在は`development`のみ）

5. **Run workflowをクリックして実行**
   - 緑色の **Run workflow** ボタンをクリック

6. **デプロイの進行状況を確認**
   - ワークフロー実行ページで各ジョブの進行状況を確認
   - 各ステップのログを確認可能
   - "AWS authentication successful (OIDC)"メッセージが表示されることを確認

### デプロイパターン例

#### パターン1: バックエンドのみデプロイ

コード変更をLambda関数に反映する場合：

- ✅ Deploy Backend
- ⬜ Deploy Infrastructure
- ⬜ Deploy Frontend Web
- Environment: development

**所要時間**: 約3-5分

#### パターン2: インフラストラクチャのみデプロイ

CDKスタックの変更を反映する場合：

- ⬜ Deploy Backend
- ✅ Deploy Infrastructure
- ⬜ Deploy Frontend Web
- Environment: development

**所要時間**: 約5-10分

#### パターン3: フロントエンドWebのみデプロイ

Expo Webアプリの変更を反映する場合：

- ⬜ Deploy Backend
- ⬜ Deploy Infrastructure
- ✅ Deploy Frontend Web
- Environment: development

**所要時間**: 約3-5分

**注意**: CloudFrontキャッシュの無効化には5-10分かかる場合があります。

#### パターン4: 全コンポーネント一括デプロイ

全ての変更を一度に反映する場合：

- ✅ Deploy Backend
- ✅ Deploy Infrastructure
- ✅ Deploy Frontend Web
- Environment: development

**所要時間**: 約10-15分

## 各コンポーネントのデプロイ詳細

### Backend デプロイ

**処理内容**:
1. OIDC認証でAWSにアクセス
2. AWS Public ECRにログイン（レート制限回避）
3. Dockerイメージをビルド（`backend/Dockerfile`）
4. ECRにイメージをプッシュ（`janlog-api-development`リポジトリ）
5. Lambda関数のコードを更新（`janlog-api-development`関数）

**使用するMakefileコマンド**:
```bash
make deploy-backend
```

**デプロイ後の確認**:
- Lambda関数のイメージURIが更新されていることを確認
- Lambda関数のログを確認（CloudWatch Logs）
- APIエンドポイントにリクエストを送信して動作確認

### Infrastructure デプロイ

**処理内容**:
1. OIDC認証でAWSにアクセス
2. Node.js環境をセットアップ（`.nvmrc`に基づく）
3. CDK依存関係をインストール（`npm ci`）
4. CDKプロジェクトをビルド（`npm run build`）
5. CDK synthを実行（構文チェック）
6. CDKスタックをデプロイ（`cdk deploy --all`）

**デプロイされるリソース**:
- S3バケット（Web版ホスティング用）
- Cognito User Pool（認証用）
- API Gateway（HTTPエンドポイント）
- Lambda関数（バックエンドAPI）
- ECRリポジトリ（Dockerイメージ用）
- CloudFront Distribution（Web版配信用）
- IAMロール（各サービス用）
- GitHub OIDC用IAMロール（CI/CD用）

**デプロイ後の確認**:
- CloudFormationスタックのステータスが`UPDATE_COMPLETE`または`CREATE_COMPLETE`であることを確認
- 各リソースが正常に作成されていることを確認

### Frontend Web デプロイ

**処理内容**:
1. OIDC認証でAWSにアクセス
2. Node.js環境をセットアップ（`.nvmrc`に基づく）
3. フロントエンド依存関係をインストール（`npm ci`）
4. Expo Webアプリをビルド（`make web-build-deploy`）
   - `.env.local`を一時的にリネーム
   - `.env.development`を使用してビルド
   - `frontend/dist/`に静的ファイルを生成
5. S3バケットにファイルをアップロード
   - 静的アセット: `max-age=31536000, immutable`（1年間キャッシュ）
   - HTML/JSON: `max-age=0, must-revalidate`（キャッシュなし）
6. CloudFrontキャッシュを無効化（`/*`パス）

**使用するMakefileコマンド**:
```bash
make web-build-deploy
```

**デプロイ後の確認**:
- S3バケットにファイルがアップロードされていることを確認
- CloudFrontキャッシュ無効化のステータスを確認
- CloudFront URLにアクセスして動作確認

**注意事項**:
- CloudFrontキャッシュの無効化には5-10分かかる場合があります
- キャッシュ無効化が完了するまで、古いバージョンが表示される可能性があります

## デプロイ前の確認事項

### 共通

- [ ] 変更内容がmainブランチにマージされている
- [ ] OIDCスタックがデプロイされている
- [ ] IAMロール`janlog-github-actions-development`が存在する
- [ ] デプロイ対象の環境（development）が正しい

### Backend デプロイ前

- [ ] `backend/Dockerfile`に構文エラーがないことを確認
- [ ] `backend/requirements.txt`が最新である
- [ ] ローカルでDockerビルドが成功することを確認（`make docker-build`）
- [ ] ECRリポジトリ（`janlog-api-development`）が存在する
- [ ] Lambda関数（`janlog-api-development`）が存在する

### Infrastructure デプロイ前

- [ ] CDKコードに構文エラーがないことを確認
- [ ] ローカルでCDK synthが成功することを確認（`cd infra && npm run synth`）
- [ ] 既存のCloudFormationスタックが正常な状態である
- [ ] 破壊的な変更がないことを確認（リソースの削除・置換）

### Frontend Web デプロイ前

- [ ] `frontend/.env.development`が正しく設定されている
- [ ] ローカルでExpo Webビルドが成功することを確認（`make web-build`）
- [ ] S3バケット（`janlog-web-development`）が存在する
- [ ] CloudFront Distributionが存在する

## トラブルシューティング

### OIDC認証エラー

#### エラー1: "User: arn:aws:sts::xxx:assumed-role/janlog-github-actions-development/... is not authorized to perform: sts:AssumeRoleWithWebIdentity"

**原因**: OIDCプロバイダーまたはIAMロールが正しく作成されていない

**解決方法**:
1. AWSコンソールでIAMロール`janlog-github-actions-development`が存在することを確認
2. ロールのトラストポリシーを確認：
   ```bash
   aws iam get-role --role-name janlog-github-actions-development
   ```
3. OIDCプロバイダーが存在することを確認：
   ```bash
   aws iam list-open-id-connect-providers
   ```
4. CDKスタックを再デプロイ：
   ```bash
   cd infra && npm run deploy -- --context environment=development JanlogGitHubOidcStack-development
   ```

#### エラー2: "Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity"

**原因**: トラストポリシーのリポジトリ名が正しくない

**解決方法**:
1. `infra/bin/janlog-infra.ts`のGitHub organizationとリポジトリ名を確認：
   ```typescript
   githubOrg: 'notubo',  // 実際のGitHub organizationまたはユーザー名
   githubRepo: 'janlog-app',  // 実際のリポジトリ名
   ```
2. 正しい値に修正してCDKスタックを再デプロイ

#### エラー3: "Error: Credentials could not be loaded"

**原因**: ワークフローファイルの`permissions`が不足している

**解決方法**:
1. `.github/workflows/cd.yml`の各ジョブに以下が含まれていることを確認：
   ```yaml
   permissions:
     id-token: write
     contents: read
   ```

### 権限エラー

#### エラー: "AccessDenied: User: ... is not authorized to perform: ecr:GetAuthorizationToken"

**原因**: IAMロールに必要な権限が不足している

**解決方法**:
1. `infra/lib/stacks/github-oidc-stack.ts`の権限ポリシーを確認
2. 必要な権限を追加してCDKスタックを再デプロイ
3. IAMロールのポリシーを確認：
   ```bash
   aws iam list-role-policies --role-name janlog-github-actions-development
   aws iam list-attached-role-policies --role-name janlog-github-actions-development
   ```

### Dockerビルドエラー

**エラーメッセージ例**:
```
ERROR: failed to solve: process "/bin/sh -c pip install --no-cache-dir -r requirements.txt" did not complete successfully
```

**解決方法**:
1. `backend/Dockerfile`の構文を確認
2. `backend/requirements.txt`の依存関係を確認
3. ローカルでDockerビルドを実行して再現（`make docker-build`）
4. Dockerイメージのベースイメージが利用可能か確認

### ECRレート制限エラー

**エラーメッセージ例**:
```
toomanyrequests: Rate exceeded
```

**解決方法**:
- ワークフローには既にAWS Public ECRへのログインステップが含まれています
- OIDC認証により、認証済みのレート制限が適用されます
- 複数回連続でデプロイを実行した場合は、数分待ってから再実行してください

### CDKデプロイエラー

**エラーメッセージ例**:
```
CREATE_FAILED: Resource creation failed
```

**解決方法**:
1. CloudFormationコンソールでスタックのイベントを確認
2. エラーメッセージから原因を特定
3. ローカルでCDK synthを実行して構文エラーを確認（`cd infra && npm run synth`）
4. リソース名の競合がないか確認
5. IAMロールの権限が不足していないか確認

### S3アップロードエラー

**エラーメッセージ例**:
```
An error occurred (AccessDenied) when calling the PutObject operation
```

**解決方法**:
1. S3バケットが存在することを確認
2. IAMロールにS3への書き込み権限があることを確認
3. バケットポリシーが正しく設定されているか確認

### CloudFrontキャッシュ無効化エラー

**エラーメッセージ例**:
```
An error occurred (AccessDenied) when calling the CreateInvalidation operation
```

**解決方法**:
1. CloudFront Distributionが存在することを確認
2. IAMロールにCloudFrontへの権限があることを確認
3. Distribution IDが正しいことを確認

### ロールバック手順

#### Backend のロールバック

Lambda関数を以前のイメージに戻す：

```bash
# 以前のイメージURIを確認
aws lambda get-function --function-name janlog-api-development

# 以前のイメージに戻す
aws lambda update-function-code \
  --function-name janlog-api-development \
  --image-uri 713209208161.dkr.ecr.ap-northeast-1.amazonaws.com/janlog-api-development:<previous-tag>
```

#### Infrastructure のロールバック

CloudFormationスタックを以前のバージョンに戻す：

```bash
# スタックの変更セットを確認
aws cloudformation describe-stack-events --stack-name janlog-development

# 手動でロールバック（AWSコンソールから推奨）
# または、以前のCDKコードに戻してデプロイ
cd infra
git checkout <previous-commit>
npm run deploy -- --context environment=development
```

#### Frontend Web のロールバック

S3バケットのバージョニングが有効な場合、以前のバージョンに戻すことができます。
バージョニングが無効な場合は、以前のコミットから再デプロイしてください：

```bash
git checkout <previous-commit>
make web-build-deploy
```

## セキュリティのベストプラクティス

1. **最小権限の原則**
   - IAMロールには必要最小限の権限のみを付与
   - 定期的に権限を見直し

2. **トラストポリシーの制限**
   - 特定のリポジトリとブランチのみに制限
   - ワイルドカードの使用を最小限に

3. **監査ログの確認**
   - CloudTrailでOIDC認証の使用状況を定期的に確認
   - 異常なアクセスパターンを監視

4. **セッション名の活用**
   - `role-session-name`にワークフロー実行IDを含める
   - CloudTrailでの追跡を容易に

5. **環境の分離**
   - development環境とproduction環境で異なるIAMロールを使用
   - 各環境で独立した権限を設定

## 参考リンク

- [GitHub Actions - Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS - Creating OpenID Connect (OIDC) identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
- [AWS CDK ドキュメント](https://docs.aws.amazon.com/cdk/)
- [Expo Web ドキュメント](https://docs.expo.dev/workflow/web/)
- [プロジェクトのMakefileガイド](../Makefile.md)
