# API仕様書参照

このファイルは既存のOpenAPI仕様書を参照します。

#[[file:../../../spec/openapi.yaml]]

## 主要エンドポイント

### 認証
- `GET /me` - 現在のユーザー情報取得
- `POST /auth/invite` - Cognito招待（管理者のみ）

### 対局管理
- `GET /matches` - 対局一覧取得（期間・モードフィルター対応）
- `POST /matches` - 対局登録
- `PUT /matches/{matchId}` - 対局更新
- `DELETE /matches/{matchId}` - 対局削除

### 統計
- `GET /stats/summary` - 成績サマリ取得（期間・モードフィルター対応）

### ルール管理
- `GET /rulesets` - ルールセット一覧取得
- `POST /rulesets` - ルールセット作成（管理者のみ）
- `PUT /rulesets/{rulesetId}` - ルールセット更新（管理者のみ）
- `DELETE /rulesets/{rulesetId}` - ルールセット削除（管理者のみ）

## 認証方式
- Cognito User Pool JWT認証
- API Gateway JWT Authorizer使用
- 管理者権限は`role`属性で判定

## データ形式
- 日付: ISO 8601形式
- ゲームモード: `three` | `four`
- 入力方式: `rank_plus_points` | `rank_plus_raw` | `provisional_rank_only`