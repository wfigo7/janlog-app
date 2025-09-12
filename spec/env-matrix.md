# 環境仕様マトリクス

このドキュメントは、`local`, `development`, `production` の3環境における  
認証・バックエンド・データストアなどの設定方針をまとめたものです。

## マトリクス

| 項目 | local | development | production |
|------|-------|-------------|------------|
| **フロントエンドの認証** | 静的JWT注入（`.env.local` にMOCK_JWTを設定） | Cognito Hosted UI or embedded sign-in | Cognito Hosted UI（必須） |
| **バックエンドの認可** | JWT検証（静的JWT用）<br>※`/health`は未検証 | JWT検証（必須）<br>`/health`のみ未検証 | JWT検証（必須）<br>`/health`のみ未検証 |
| **トークンのソース** | 静的JWT（環境変数で設定） | Cognito UserPool(development) で発行 | Cognito UserPool(production) で発行 |
| **Issuer / Audience** | issuer: `mock-issuer`<br>aud: `janlog-local` | issuer: `https://cognito-idp/.../ap-northeast-1_XBTxTbEZF`<br>aud: `4u37654rhubjei088dj85clscq` | issuer: `https://cognito-idp/.../PRODPOOL`<br>aud: `PROD_CLIENT_ID` |
| **API Gateway Authorizer** | なし（FastAPI直接アクセス） | JWT/Cognito Authorizer有効 | JWT/Cognito Authorizer有効 |
| **Cognitoリソース** | なし | UserPool(development), AppClient(development) | UserPool(production), AppClient(production) |
| **テストユーザー** | 静的JWT内のダミーユーザー<br>`sub: local-user-001`<br>`email: local@example.com` | development用の実ユーザー（少数） | 本番ユーザー |
| **データストア** | DynamoDB Local<br>`janlog-table-local` | DynamoDB<br>`janlog-table-development` | DynamoDB<br>`janlog-table-production` |
| **CORS設定** | `*`（開発効率重視） | CloudFront+S3のオリジンを許可 | 本番ドメインのみ許可 |
| **フロントエンド配信** | Expo開発サーバー（localhost） | CloudFront + S3 | CloudFront + S3 |
| **フロントENV例** | `AUTH_MODE=mock`<br>`MOCK_JWT=eyJ...` | `AUTH_MODE=cognito`<br>`COGNITO_POOL_ID=ap-northeast-1_XBTxTbEZF`<br>`COGNITO_CLIENT_ID=4u37654rhubjei088dj85clscq` | `AUTH_MODE=cognito`<br>`COGNITO_POOL_ID=PROD_POOL_ID`<br>`COGNITO_CLIENT_ID=PROD_CLIENT_ID` |
| **バックエンドENV例** | `ENVIRONMENT=local`<br>`COGNITO_USER_POOL_ID=`（空）<br>`COGNITO_CLIENT_ID=`（空）<br>`JWT_ISSUER=mock-issuer`<br>`JWT_AUDIENCE=janlog-local` | `ENVIRONMENT=development`<br>`COGNITO_USER_POOL_ID=ap-northeast-1_XBTxTbEZF`<br>`COGNITO_CLIENT_ID=4u37654rhubjei088dj85clscq` | `ENVIRONMENT=production`<br>`COGNITO_USER_POOL_ID=PROD_POOL_ID`<br>`COGNITO_CLIENT_ID=PROD_CLIENT_ID` |
| **デプロイ/パイプライン** | なし（ローカル実行） | mainブランチ→development（GitHub Actions自動） | mainブランチ→production（承認付き、将来実装） |

## 静的JWT設定詳細

local環境で使用する静的JWTの内容：

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

## リソース命名規則

- DynamoDB: `janlog-table-{environment}`
- Cognito User Pool: `janlog-user-pool-{environment}`
- Cognito User Pool Client: `janlog-client-{environment}`
- API Gateway: `janlog-api-{environment}`
- S3 Bucket: `janlog-frontend-{environment}-{account}`

## 補足

- local環境では静的JWT認証により、本番互換性を保ちつつ開発効率を重視
- development環境は実際のユーザー公開（MVP）に使用し、本番同等の認証フローを実装
- production環境は将来実装予定、設計のみ準備
- 環境名は略称を使わず統一（`local`, `development`, `production`）
- 詳細な決定理由は [ADR-0005 環境分離戦略](./adr/ADR-0005-environment-strategy.md) を参照
