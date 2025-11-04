# 対局種別フィールド追加 - 実装タスク

## Phase 1: バックエンド実装

- [x] 1. データモデルとバリデーションの実装
  - `backend/app/models/match.py`にMatchType型を追加し、MatchとMatchInputモデルにmatchTypeフィールドを追加する
  - `backend/app/validators/match_validator.py`にvalidate_match_type関数を実装する
  - matchTypeが"free"、"set"、"competition"、またはnullであることを検証する
  - _要件: 1.1, 1.2, 10.1, 10.2, 10.3_

- [x] 2. リポジトリ層の拡張
  - `backend/app/repositories/match_repository.py`のget_matchesメソッドにmatch_typeパラメータを追加する
  - match_typeフィルタリングロジックを実装する（"free"、"set"、"competition"対応）
  - create_matchメソッドでmatchTypeがnullでない場合のみDynamoDBに保存する
  - update_matchメソッドでmatchTypeの更新をサポートする
  - _要件: 7.4, 7.5, 7.6, 8.3, 8.4, 8.5_

- [x] 3. APIエンドポイントの拡張
  - `backend/app/routers/matches.py`のGET /matchesエンドポイントにmatchTypeクエリパラメータを追加する
  - POST /matchesとPUT /matches/{matchId}エンドポイントでmatchTypeフィールドを受け付ける
  - `backend/app/routers/stats.py`のGET /stats/summaryエンドポイントにmatchTypeクエリパラメータを追加する
  - _要件: 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [x] 4. OpenAPI仕様の更新
  - `spec/openapi.yaml`のMatchスキーマにmatchTypeフィールドを追加する（enum: [free, set, competition], nullable: true）
  - GET /matchesとGET /stats/summaryのクエリパラメータにmatchTypeを追加する
  - matchTypeフィールドの配置をrulesetIdの後、venueIdの前にする
  - _要件: 7.1, 7.2, 7.3, 7.9_

- [x] 5. バックエンドユニットテストの実装
  - `backend/tests/test_match_validation.py`にvalidate_match_typeのテストを追加する
  - _要件: 9.1, 9.2, 9.3, 9.4, 9.5_

## Phase 2: フロントエンド基本実装

- [x] 6. 型定義の拡張
  - `frontend/src/types/match.ts`にMatchType型を追加する（"free" | "set" | "competition"）
  - MatchインターフェースにmatchType: MatchType | nullフィールドを追加する
  - MatchInputインターフェースにmatchType: MatchType | nullフィールドを追加する
  - _要件: 1.2, 1.9_

- [x] 7. MatchTypeSelectorコンポーネントの実装
  - `frontend/src/components/match/MatchTypeSelector.tsx`を作成する
  - 「フリー」「セット」「競技」の3つのボタンを実装する
  - 選択中のボタンを視覚的に強調表示する
  - 選択済みボタンの再タップで選択解除（null設定）を実装する
  - 順位選択ボタンや入力方式選択ボタンと同じデザインパターンを使用する
  - _要件: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.11, 2.12_

- [x] 8. 対局登録画面への統合
  - `frontend/src/components/match/MatchRegistrationScreen.tsx`にMatchTypeSelectorを追加する
  - ルールセット選択フィールドの下、会場選択フィールドの上に配置する
  - 対局登録時にmatchTypeをAPIに送信する
  - matchTypeが未選択の場合はnullとして送信する
  - _要件: 2.1, 2.2, 2.10_

- [x] 9. 対局編集画面への統合
  - `frontend/src/components/match/MatchEditScreen.tsx`にMatchTypeSelectorを追加する
  - 既存対局のmatchType値をボタン選択状態で表示する
  - matchTypeがnullの場合は全てのボタンを未選択状態で表示する
  - 対局更新時にmatchTypeをAPIに送信する
  - _要件: 3.1, 3.2, 3.3, 3.4_

- [x] 9.1 対局詳細画面への統合
  - 対局詳細画面の基本情報にmatchTypeを表示する
  - _要件: 3.1, 3.2, 3.3, 3.4_

- [x] 10. フロントエンドコンポーネントテストの実装
  - `frontend/__tests__/components/MatchTypeSelector.test.tsx`を作成する
  - ボタンレンダリング、選択、選択解除のテストを実装する
  - 対局登録画面・編集画面への統合テストを実装する
  - _要件: 2.1, 2.6, 2.7, 2.8, 2.9_

## Phase 3: フィルタリング機能実装

- [x] 11. MatchTypeFilterコンポーネントの実装
  - `frontend/src/components/common/FilterBar.tsx`に対局種別フィルタを追加する
  - 「すべて」「フリー」「セット」「競技」の4つの選択肢を実装する
  - デフォルトで「すべて」を選択する（nullの対局も含む）
  - 選択値の変更をonChangeコールバックで通知する
  - 注: 「指定なし」オプションは運用上不要と判断し実装しない
  - _要件: 5.1, 5.2, 5.3, 5.10, 6.1, 6.2, 6.3, 6.10_

- [x] 12. 統計画面へのフィルタ追加
  - `frontend/src/components/stats/StatsScreen.tsx`にMatchTypeFilterを追加する
  - 期間フィルタとゲームモードフィルタと並んで配置する
  - フィルタ変更時にmatchTypeクエリパラメータ付きでGET /stats/summaryを呼び出す
  - 統計データを再計算して表示する
  - _要件: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 13. 履歴画面へのフィルタ追加
  - `frontend/src/components/history/HistoryScreen.tsx`にMatchTypeFilterを追加する
  - 期間フィルタとゲームモードフィルタと並んで配置する
  - フィルタ変更時にmatchTypeクエリパラメータ付きでGET /matchesを呼び出す
  - 履歴リストを再取得して表示する
  - _要件: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [x] 14. MatchTypeBadgeコンポーネントの実装
  - `frontend/src/components/common/MatchTypeBadge.tsx`を作成する
  - matchTypeがnullの場合は何も表示しない
  - matchTypeが"free"の場合は「フリー」バッジを表示する（緑色）
  - matchTypeが"set"の場合は「セット」バッジを表示する（青色）
  - matchTypeが"competition"の場合は「競技」バッジを表示する（オレンジ色）
  - _要件: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 15. 履歴画面へのバッジ表示追加
  - `frontend/src/components/history/MatchList.tsx`にMatchTypeBadgeを追加する
  - ルール名の近くに配置する
  - 各対局の対局種別をバッジで表示する
  - _要件: 4.1, 4.6_

- [x] 16. フィルタリング機能のテスト実装

  - `frontend/__tests__/components/MatchTypeFilter.test.tsx`を作成する
  - フィルタ選択肢のレンダリングテストを実装する
  - 統計画面・履歴画面でのフィルタリング動作テストを実装する
  - MatchTypeBadgeの表示テストを実装する
  - _要件: 5.1, 5.3, 6.1, 6.3, 4.2, 4.3, 4.4, 4.5_

## Phase 4: 統合テスト・検証

- [x] 17. 既存データとの互換性検証
  - 既存の対局データ（matchType=null）を読み込んで表示できることを確認する
  - 既存データを編集してmatchTypeを追加できることを確認する
  - 既存データが「すべての対局種別」フィルタで表示できることを確認する
  - データマイグレーションなしで動作することを確認する
  - _要件: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 18. E2Eテストの実装
  - 対局登録時にmatchTypeを選択して保存できることを確認する
  - 対局編集時にmatchTypeを変更できることを確認する
  - 統計画面でmatchTypeフィルタが動作することを確認する
  - 履歴画面でmatchTypeフィルタが動作することを確認する
  - matchTypeBadgeが正しく表示されることを確認する
  - _要件: 2.10, 3.3, 5.9, 6.9, 4.1_

- [ ]* 19. パフォーマンステスト
  - 大量の対局データ（1000件以上）でフィルタリングのパフォーマンスを確認する
  - DynamoDBクエリのレスポンスタイムを測定する
  - フロントエンドのレンダリングパフォーマンスを確認する
  - 必要に応じて最適化を実施する

- [x] 20. ドキュメント更新
  - `README.md`に対局種別機能の説明を追加する
  - `CHANGELOG.md`に変更内容を記録する
  - API仕様書（OpenAPI）が最新であることを確認する
  - Core統合仕様（`.kiro/specs/core/`）への統合を検討する
