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

### JanlogApiStack

- API Gateway HTTP API
- Lambda Function (FastAPI)
- DynamoDB Table
- Cognito User Pool
- IAM Roles & Policies

### JanlogMonitoringStack

- CloudWatch Dashboards
- CloudWatch Alarms
- SNS Topics (アラート通知)

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
npm run test:infra

# または直接このディレクトリで
cd infra
npm test
```

## ディレクトリ構造

```
infra/
├── lib/
│   ├── janlog-api-stack.ts      # メインAPIスタック
│   ├── janlog-monitoring-stack.ts # 監視スタック
│   └── constructs/              # 再利用可能なコンストラクト
├── bin/
│   └── infra.ts                 # CDKアプリエントリーポイント
└── test/                        # テストファイル
```

## 関連ドキュメント

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter)
- [DynamoDB Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)