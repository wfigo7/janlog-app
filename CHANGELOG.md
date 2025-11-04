# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-04

### Added
- 対局種別フィールド（フリー/セット/競技）の追加
- 対局登録・編集画面での対局種別選択機能
- 対局詳細画面での対局種別表示（バッジ表示）
- 統計画面での対局種別フィルタリング機能
- 履歴画面での対局種別フィルタリング機能
- 対局種別に関するユニットテスト・コンポーネントテスト

### Changed
- FilterBarコンポーネントに対局種別フィルタを統合
- API仕様に対局種別パラメータを追加（GET /matches, GET /stats/summary）

### Technical
- 既存データとの後方互換性を維持（matchType=null対応）
- バックエンド: MatchRequest/MatchモデルにmatchTypeフィールド追加
- フロントエンド: MatchTypeSelectorコンポーネント、MatchTypeBadgeコンポーネント追加
- OpenAPI仕様更新

## [0.1.0] - 2025-11-04

### Added
- 初期MVPリリース
- 対局記録機能（3人麻雀・4人麻雀対応）
- 3つの入力方式（順位+最終ポイント、順位+素点、仮ポイント）
- 成績統計表示（対局数、平均順位、トップ率、ラス率、累積ポイント、チップ合計）
- 成績履歴表示
- ルールセット管理機能（ウマ・オカ設定）
- Cognito招待制ユーザー認証

### Infrastructure
- FastAPI on Lambda Web Adapter
- DynamoDB シングルテーブル設計
- Cognito User Pool認証
- 環境分離戦略（local/development/production）

[0.2.0]: https://github.com/wfigo7/janlog-app/releases/tag/v0.2.0
[0.1.0]: https://github.com/wfigo7/janlog-app/releases/tag/v0.1.0

