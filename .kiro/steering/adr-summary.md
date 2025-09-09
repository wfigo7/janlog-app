# アーキテクチャ決定記録（ADR）サマリ

## ADR-0001: FastAPI on Lambda Web Adapter

**決定**: バックエンドはFastAPI（ASGI）をLambda Web Adapter (LWA)で実行

**理由**:
- 個人～少人数利用のMVP、月額コスト数百〜千円台に抑制
- ローカル開発はFastAPI + uvicornの快適さを活用
- 将来App Runner/ECSへ移行可能な柔軟性

**トレードオフ**: コールドスタート発生（数百ms〜）

## ADR-0002: DynamoDB シングルテーブル設計

**決定**: DynamoDB（オンデマンド課金）でシングルテーブル設計

**エンティティ構成**:
- `USER#{userId}/MATCH#{matchId}` - 対局データ
- `USER#{userId}/RULESET#{rulesetId}` - ルールセット
- `USER#{userId}/VENUE#{venueId}` - 会場データ
- `USER#{userId}/PROFILE` - ユーザープロフィール

**GSI**:
- GSI1: MATCH_BY_USER_DATE（期間取得）
- GSI2: MATCH_BY_USER_MODE_DATE（3麻/4麻高速フィルタ）

**理由**: 少人数・低トラでコスト最小化、運用負荷軽減

## ADR-0003: 認証にAmazon Cognito

**決定**: Cognito User Poolでメール+パスワード認証

**招待フロー**:
- 管理者がAdminCreateUser APIでユーザー作成
- Cognitoが自動で一時パスワード付き招待メール送信
- ユーザーは初回ログイン時に新パスワード設定

**理由**: 少人数招待配布、API Gateway JWT認可との相性

## ADR-0004: モノレポ構成と/spec仕様集約

**決定**: モノレポ構成、仕様関連は`/spec/`に集約

**構成**:
- `/spec/openapi.yaml` - APIの単一ソース
- `/spec/context.md` - 全体要約
- `/spec/adr/` - アーキテクチャ決定記録

**理由**: フロント/バック/インフラ横断での仕様共有、Kiroツール対応