# Janlog Infrastructure

AWS CDK を使用したインフラストラクチャ定義

## 概要

JanlogのAWSインフラストラクチャをAWS CDK (TypeScript) で定義・管理します。

## アーキテクチャ

- **API Gateway**: HTTP API (JWT認証)
- **Lambda**: FastAPI アプリケーション (Lambda Web Adapter)
- **DynamoDB**: シングルテーブル設計
- **Cognito**: ユーザー認証・認可
- **CloudWatch**: ログ・メトリクス

## 技術スタック

- **IaC**: AWS CDK v2
- **言語**: TypeScript
- **デプロイ**: GitHub Actions
- **監視**: CloudWatch

## 開発環境セットアップ

### 前提条件

- Node.js 18+
- AWS CLI (設定済み)
- AWS CDK CLI

### インストール

```bash
# プロジェクトルートから
npm install

# または直接このディレクトリで
cd infra
npm install
```

### CDK初期化（初回のみ）

```bash
cd infra
npx cdk bootstrap
```

## デプロイ

### 開発環境

```bash
# プロジェクトルートから
npm run deploy:infra

# または直接このディレクトリで
cd infra
npx cdk deploy --all
```

### 本番環境

```bash
cd infra
npx cdk deploy --all --context environment=production
```

## スタック構成

### JanlogS3Stack (現在実装済み)

- S3 Bucket (テスト用)
- 自動削除設定 (開発環境)

### 今後実装予定

- **JanlogApiStack**: API Gateway HTTP API, Lambda Function (FastAPI)
- **JanlogDatabaseStack**: DynamoDB Table
- **JanlogAuthStack**: Cognito User Pool
- **JanlogMonitoringStack**: CloudWatch Dashboards, Alarms

## 環境管理

環境別の設定は `cdk.json` の `context` で管理：

```json
{
  "context": {
    "development": {
      "domainName": "dev-api.janlog.app",
      "certificateArn": "arn:aws:acm:..."
    },
    "production": {
      "domainName": "api.janlog.app",
      "certificateArn": "arn:aws:acm:..."
    }
  }
}
```

## コスト最適化

- DynamoDB: オンデマンド課金
- Lambda: ARM64 (Graviton2)
- API Gateway: HTTP API (REST APIより安価)

## テスト

```bash
# プロジェクトルートから
make test-infra  # または make ti

# このディレクトリから（サブディレクトリからのmake実行対応）
cd infra
make test-infra  # ルートから実行したのと同じ動作
make ti          # 短縮形も使用可能

# 直接npmコマンドで実行
npm test
```

### 📁 サブディレクトリからのmake実行対応

**このディレクトリからでもプロジェクトルートと同じmakeコマンドが使用可能です！**

```bash
cd infra

# インフラテスト実行
make test-infra  # または make ti

# 全体のヘルプ表示
make help

# 環境確認
make check

# その他全てのmakeコマンドが使用可能
```

この機能により、インフラ開発中にディレクトリを移動することなく、必要なコマンドを実行できます。

## ディレクトリ構造

```
infra/
├── lib/
│   ├── common/
│   │   └── stack-props.ts       # 共通スタックプロパティ
│   └── stacks/
│       └── s3-stack.ts          # S3スタック (実装済み)
├── bin/
│   └── janlog-infra.ts          # CDKアプリエントリーポイント
└── test/                        # テストファイル
```

## 関連ドキュメント

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter)
- [DynamoDB Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)