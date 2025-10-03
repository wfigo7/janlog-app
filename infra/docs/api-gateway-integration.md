# API Gateway統合実装ドキュメント

## 概要

タスク25「API Gateway統合の実装」が完了しました。API GatewayとLambda関数の統合設定により、HTTPリクエストがLambda Web Adapter経由でFastAPIアプリケーションに転送されるようになりました。

## 実装内容

### 1. API Gateway設定

- **API タイプ**: HTTP API（REST APIより軽量で高速）
- **プロトコル**: HTTP
- **CORS設定**: 開発環境では全オリジン許可、本番環境では制限予定
- **自動デプロイ**: `$default` ステージで有効

### 2. Lambda統合

- **統合タイプ**: `AWS_PROXY`（プロキシ統合）
- **ペイロード形式**: Version 2.0（最新形式）
- **Lambda権限**: API Gatewayからの呼び出し許可を自動設定

### 3. ルート設定

#### プロキシルート（`/{proxy+}`）
- **対応メソッド**: GET, POST, PUT, DELETE, OPTIONS
- **認証**: なし（現在のフェーズ1実装）
- **用途**: 全てのAPIエンドポイントを受け付け

#### ヘルスチェックルート（`/health`）
- **対応メソッド**: GET
- **認証**: なし
- **用途**: アプリケーション稼働状況確認

### 4. JWT Authorizer

- **タイプ**: JWT
- **認証ソース**: `Authorization` ヘッダー
- **発行者**: Cognito User Pool
- **対象**: User Pool Client
- **状態**: 設定済み（フェーズ4で使用予定）

## デプロイ構成

### スタック依存関係

```
CognitoStack → LambdaStack → ApiGatewayStack
     ↓              ↓              ↓
  User Pool    Lambda Function   HTTP API
     ↓              ↓              ↓
JWT Authorizer ← Lambda統合 ← プロキシルート
```

### 環境別設定

- **local環境**: API Gatewayスタックは作成されない
- **development環境**: 全機能有効
- **production環境**: CORS制限、セキュリティ強化

## API エンドポイント

### 現在利用可能（認証なし）

```
GET    /health                    # ヘルスチェック
GET    /                         # API情報
POST   /matches                  # 対局登録
GET    /matches                  # 対局一覧取得
GET    /matches/{matchId}        # 対局詳細取得
PUT    /matches/{matchId}        # 対局更新
DELETE /matches/{matchId}        # 対局削除
GET    /stats/summary            # 統計サマリ取得
GET    /venues                   # 会場一覧取得
GET    /rulesets                 # ルールセット一覧取得
POST   /rulesets                 # ルールセット作成
POST   /rulesets/calculate       # ポイント計算
```

### 将来実装予定（認証付き）

```
POST   /api/v1/matches           # 対局登録（認証付き）
GET    /api/v1/matches           # 対局一覧取得（認証付き）
GET    /api/v1/stats/summary     # 統計サマリ取得（認証付き）
GET    /me                       # ユーザー情報取得（認証付き）
```

## テスト方法

### 1. CDK構文チェック

```bash
cd infra
cdk synth --context environment=development
```

### 2. デプロイ（開発環境）

```bash
cd infra
cdk deploy --context environment=development
```

### 3. API動作確認

デプロイ後、出力されるAPI Gateway URLを使用：

```bash
# ヘルスチェック
curl https://{api-id}.execute-api.ap-northeast-1.amazonaws.com/health

# API情報取得
curl https://{api-id}.execute-api.ap-northeast-1.amazonaws.com/

# 対局一覧取得（空の場合）
curl https://{api-id}.execute-api.ap-northeast-1.amazonaws.com/matches
```

## セキュリティ考慮事項

### 現在の実装（フェーズ1）

- 認証なしエンドポイントのみ
- 固定ユーザーID（`test-user-001`）を使用
- CORS設定で全オリジン許可（開発環境）

### 将来の強化（フェーズ4以降）

- JWT認証の有効化
- 認証付きエンドポイントの追加
- CORS設定の制限
- レート制限の実装

## トラブルシューティング

### よくある問題

1. **SSL証明書エラー（WSL環境）**
   - 症状: Docker buildでSSL証明書検証失敗
   - 対処: 一時的にインラインLambda関数で構文チェック

2. **Lambda権限エラー**
   - 症状: API Gatewayからの呼び出しが403エラー
   - 対処: Lambda権限が自動設定されることを確認

3. **CORS エラー**
   - 症状: ブラウザからのリクエストがブロック
   - 対処: CORS設定とプリフライトリクエスト対応を確認

### ログ確認

```bash
# CloudWatch Logsでの確認
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/janlog-api"
aws logs tail /aws/lambda/janlog-api-development --follow
```

## 次のステップ

1. **タスク26**: 開発環境疎通確認
   - DynamoDB→Lambda→API Gatewayの疎通確認
   - 実際のAPIエンドポイント動作確認

2. **タスク27**: フロントエンド環境設定
   - API Gateway URLの設定
   - Expo環境設定の更新

3. **タスク28**: Expo→API Gateway疎通確認
   - フロントエンドからの接続確認
   - エンドツーエンドテスト

## 実装ファイル

- `infra/lib/stacks/api-gateway-stack.ts`: API Gateway設定
- `infra/lib/stacks/lambda-stack.ts`: Lambda統合設定
- `infra/bin/janlog-infra.ts`: スタック依存関係設定
- `backend/app/main.py`: FastAPIアプリケーション
- `backend/lambda_function.py`: Lambda Web Adapterエントリーポイント