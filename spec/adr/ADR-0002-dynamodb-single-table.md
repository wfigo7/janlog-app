# ADR-0002: DynamoDB シングルテーブル設計を採用する

## 日付
2025-09-08

## 背景
- ユーザー別に対局データを蓄積。アクセスは「期間別の一覧」「集計」「（将来）ルーム共有」中心。
- 少人数・低トラでコスト最小化が重要。運用負荷を下げたい。

## 決定
- データベースは DynamoDB（オンデマンド課金）。
- シングルテーブル設計で以下のエンティティを同居：
  - USER#{userId}/MATCH#{matchId}
  - USER#{userId}/RULESET#{rulesetId}
  - USER#{userId}/VENUE#{venueId}
  - （将来）ROOM#{roomId}/MEMBER#{userId}
- GSI:
  - GSI1: MATCH_BY_USER_DATE（期間取得）
  - （将来）GSI2: MATCH_BY_USER_MODE_DATE（3麻/4麻の高速フィルタ）

## 代替案
- RDS/PostgreSQL：運用・固定費・スキーマ進化の負担が大きい。
- Firestore/Supabase：AWS外依存が増え、既存AWS構成と分離。

## トレードオフ
- リレーショナル結合は不得意（アクセスパターン設計で解決）。
- 柔軟な ad-hoc 分析には不向き（必要時に S3 エクスポート＋Athena）。

## 撤回条件
- 複雑な結合・集計要求が主になり、NoSQL最適化のコストが逆転する。
- データサイズ/トラフィックが大幅増で別ストレージ戦略が必要。
