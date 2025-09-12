# 環境分離戦略

## 環境分離の詳細仕様

環境分離の詳細な設計と実装方針については以下を参照してください：

#[[file:../../../spec/adr/ADR-0005-environment-strategy.md]]

#[[file:../../../spec/env-matrix.md]]

## 3つの環境

### local環境
- **目的**: 開発者のローカル開発環境
- **認証**: 静的JWT注入（開発効率重視）
- **データストア**: DynamoDB Local
- **特徴**: 本番互換性を保ちつつ開発効率を最大化

### development環境
- **目的**: 開発・テスト・MVP公開環境
- **認証**: 実際のCognito User Pool JWT認証
- **データストア**: AWS DynamoDB
- **特徴**: 本番同等の認証フローで検証

### production環境
- **目的**: 本番環境（将来実装）
- **認証**: Cognito User Pool JWT認証（本番用）
- **データストア**: AWS DynamoDB（本番用）
- **特徴**: セキュリティ最優先、最小権限

## 現在の実装状況

- **local環境**: 静的JWT生成ツール実装済み
- **development環境**: Cognito User Pool作成済み（ap-northeast-1_XBTxTbEZF）
- **production環境**: 設計のみ、実装は将来

## 環境設定ファイル

- `backend/.env.local` - local環境用設定
- `backend/.env.development` - development環境用設定
- `backend/.env.production` - production環境用設定（将来）

## CDK環境分離

- local環境: S3スタックのみ
- development/production環境: S3 + Cognito + API Gatewayスタック

## 静的JWT設定（local環境）

```json
{
  "sub": "local-user-001",
  "email": "local@example.com",
  "cognito:username": "local-user",
  "custom:role": "user",
  "iss": "mock-issuer",
  "aud": "janlog-local",
  "exp": 9999999999
}
```

## 重要な原則

1. **命名規則統一**: `janlog-{resource}-{environment}`（略称なし）
2. **環境検証**: 無効な環境名でのデプロイを防止
3. **設定分離**: 環境ごとの設定ファイル管理
4. **段階的実装**: 必要な環境から順次実装