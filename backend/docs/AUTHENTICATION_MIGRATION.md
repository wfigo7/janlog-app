# 認証付きAPI移行ガイド

## 概要

バックエンドAPIを認証なしベースから認証ありベースに移行しました。

## 主な変更点

### 1. エンドポイント構造の変更

**変更前:**
- 認証なし: `/matches`, `/stats/summary`, `/rulesets` など
- 認証あり: `/api/v1/matches`, `/api/v1/stats/summary`, `/api/v1/rulesets` など

**変更後:**
- 全てのエンドポイントが `/api/v1/` プレフィックス付きに統一
- 認証なしエンドポイントは削除

### 2. APIRouterの導入

**保守性の向上:**
- `/api/v1/` プレフィックスを各関数に埋め込まず、APIRouterで一元管理
- 新しいエンドポイント追加時にプレフィックスを気にする必要がない

```python
# APIルーター（/api/v1プレフィックス）
api_router = APIRouter(prefix="/api/v1")

# エンドポイント定義（プレフィックス不要）
@api_router.get("/matches")
async def get_matches(...):
    pass

# アプリに登録
app.include_router(api_router)
```

### 3. ロギング強化

**追加されたログ:**
- 認証成功・失敗ログ（sub を含む）
- DBアクセスログ（debug レベル）
- ユーザー情報ログ（user_id を含む）
- 各操作の開始・成功・失敗ログ

**認証ログ例:**
```
# 認証成功
DEBUG - 認証成功 - sub: test-user-001
DEBUG - トークンからユーザー情報取得成功 - sub: test-user-001

# 認証失敗
WARNING - 認証失敗: トークンが提供されていません
WARNING - 認証失敗: トークンの検証に失敗しました: Signature has expired

# 管理者権限チェック
DEBUG - 管理者認証成功 - sub: test-admin-001
WARNING - 管理者権限チェック失敗 - sub: test-user-001, role: user
```

**操作ログ例:**
```
INFO - 対局登録開始 - user_id: test-user-001
DEBUG - 対局登録成功 - match_id: abc123, user_id: test-user-001
ERROR - 対局登録失敗 - user_id: test-user-001, error: バリデーションエラー
```

### 4. 認証フロー

**local環境:**
- 静的JWT認証（`mock-issuer`, `janlog-local`）
- `.env.local` の `MOCK_JWT` を使用

**development/production環境:**
- Cognito User Pool JWT認証
- API Gateway JWT Authorizer使用

## エンドポイント一覧

### 認証関連
- `GET /api/v1/me` - 現在のユーザー情報取得

### 対局関連
- `POST /api/v1/matches` - 対局登録
- `GET /api/v1/matches` - 対局一覧取得
- `GET /api/v1/matches/{match_id}` - 対局詳細取得
- `PUT /api/v1/matches/{match_id}` - 対局更新
- `DELETE /api/v1/matches/{match_id}` - 対局削除

### 統計関連
- `GET /api/v1/stats/summary` - 成績サマリ取得
- `GET /api/v1/stats/chart-data` - チャートデータ取得

### ルールセット関連
- `GET /api/v1/rulesets` - ルールセット一覧取得
- `POST /api/v1/rulesets` - ルールセット作成
- `GET /api/v1/rulesets/{ruleset_id}` - ルールセット取得
- `PUT /api/v1/rulesets/{ruleset_id}` - ルールセット更新
- `DELETE /api/v1/rulesets/{ruleset_id}` - ルールセット削除
- `POST /api/v1/rulesets/calculate` - ポイント計算
- `GET /api/v1/rulesets-templates` - ルールテンプレート一覧取得
- `GET /api/v1/rulesets-rule-options` - ルール選択肢一覧取得

### 会場関連
- `GET /api/v1/venues` - 会場一覧取得

## フロントエンド側の対応

### 1. API URLの変更

**変更前:**
```typescript
const response = await fetch(`${API_BASE_URL}/matches`);
```

**変更後:**
```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/matches`);
```

### 2. 認証ヘッダーの追加

**必須:**
```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/matches`, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
});
```

### 3. local環境でのテスト

**JWTトークンの取得:**
1. `backend/.env.local` の `MOCK_JWT` をコピー
2. フロントエンドの環境変数またはSecure Storageに設定
3. API呼び出し時に `Authorization` ヘッダーに設定

## テスト方法

### 1. ヘルスチェック（認証不要）

```bash
curl http://localhost:8080/health
```

### 2. 認証付きエンドポイント（local環境）

```bash
# JWTトークンを環境変数に設定
export MOCK_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 対局一覧取得
curl -H "Authorization: Bearer $MOCK_JWT" \
  http://localhost:8080/api/v1/matches

# ユーザー情報取得
curl -H "Authorization: Bearer $MOCK_JWT" \
  http://localhost:8080/api/v1/me
```

## トラブルシューティング

### 401 Unauthorized エラー

**原因:**
- JWTトークンが無効または期限切れ
- `Authorization` ヘッダーが設定されていない

**対処法:**
1. `.env.local` の `MOCK_JWT` が正しく設定されているか確認
2. フロントエンドで `Authorization` ヘッダーが正しく設定されているか確認

### 403 Forbidden エラー

**原因:**
- 管理者権限が必要なエンドポイントにアクセスしている

**対処法:**
1. 管理者用の `MOCK_JWT` を使用（`.env.local` にコメントアウトされている）

### 500 Internal Server Error

**原因:**
- サーバー内部エラー

**対処法:**
1. バックエンドのログを確認（`logger.error` で出力されている）
2. DynamoDB Localが起動しているか確認

## 次のステップ

1. フロントエンドのAPI呼び出しを `/api/v1/` プレフィックス付きに変更
2. 認証ヘッダーの追加
3. local環境でのテスト
4. development環境でのテスト（実際のCognito認証）
