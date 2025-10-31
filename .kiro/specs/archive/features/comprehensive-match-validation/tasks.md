# Implementation Plan

- [x] 1. バリデーション仕様ドキュメントの整備
  - `spec/design/match-validation.md`を包括的なバリデーション仕様書として整備
  - 単一項目バリデーションの仕様を追加
  - エラーコード体系を追加
  - エラーメッセージ一覧を追加
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9_

- [x] 2. フロントエンド: バリデーション基盤の実装


- [x] 2.1 バリデーション型定義とエラーコードの作成
  - `frontend/src/types/validation.ts`を作成
  - `ValidationResult`, `ValidationError`型を定義
  - `ValidationErrorCode` enumを定義
  - エラーメッセージマッピングを定義
  - _Requirements: 8, 9_
- [x] 2.2 MatchValidatorクラスの骨格実装
  - `frontend/src/utils/matchValidator.ts`を作成
  - `MatchValidator`クラスを定義
  - 包括的バリデーションメソッド`validate()`の骨格を実装
  - _Requirements: 9, 13_

- [x] 3. フロントエンド: 単一項目バリデーションの実装
- [x] 3.1 日付バリデーションの実装
  - `validateDate()`メソッドを実装
  - ISO 8601形式チェック
  - 未来日付チェック
  - 5年以上前チェック
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.2 順位バリデーションの実装
  - `validateRank()`メソッドを実装
  - 範囲チェック（1以上）
  - ゲームモード別上限チェック（3麻は3、4麻は4）
  - _Requirements: 1.4, 1.5_

- [x] 3.3 最終ポイントバリデーションの実装
  - `validateFinalPoints()`メソッドを実装
  - 範囲チェック（-999.9〜999.9）
  - 精度チェック（小数第1位まで）
  - _Requirements: 1.6, 1.7_

- [x] 3.4 素点バリデーションの実装
  - `validateRawScore()`メソッドを実装
  - 範囲チェック（-999900〜999900）
  - 単位チェック（下2桁が00）
  - _Requirements: 1.8, 1.9_

- [x] 3.5 浮き人数バリデーションの実装
  - `validateFloatingCount()`メソッドを実装
  - 範囲チェック（0以上、ゲームモード人数以下）
  - _Requirements: 1.11, 1.12_

- [x] 4. フロントエンド: 複合バリデーションの実装
- [x] 4.1 入力方式とルールの整合性バリデーション
  - `validateEntryMethodConsistency()`メソッドを実装
  - 固定ウマルールでの浮き人数入力チェック
  - 浮きウマルールでの浮き人数必須チェック
  - 入力方式別の必須項目チェック
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.2 浮き人数の存在可能性バリデーション
  - `validateFloatingCountExistence()`メソッドを実装
  - 開始点=基準点での浮き人数0チェック
  - 開始点<基準点での浮き人数=ゲームモード人数チェック
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4.3 素点と浮き人数の整合性バリデーション
  - `validateRawScoreFloatingConsistency()`メソッドを実装
  - 浮いているのに浮き人数0チェック
  - 沈んでいるのに全員浮きチェック
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.4 順位と素点の関係バリデーション
  - `validateRankRawScoreRelation()`メソッドを実装
  - 1位で浮き2人以上なのに沈みチェック
  - 最下位で浮き少ないのに浮きチェック
  - 全員浮き/全員沈みの整合性チェック
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.5 最終ポイントとルールの整合性バリデーション
  - `validateFinalPointsConsistency()`メソッドを実装
  - ウマ定義の存在チェック
  - 計算結果の範囲チェック
  - 計算結果の精度チェック
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4.6 トップの最終ポイント下限バリデーション
  - `validateTopPointsMinimum()`メソッドを実装
  - 固定ウマルールでの下限チェック
  - 浮きウマルールでの下限チェック
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 4.7 ラスの最終ポイント上限バリデーション
  - `validateLastPointsMaximum()`メソッドを実装
  - 固定ウマルールでの上限チェック
  - 浮きウマルールでの上限チェック
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 5. フロントエンド: useMatchFormフックの更新
- [x] 5.1 既存バリデーション関数の置き換え
  - `useMatchForm.ts`の既存バリデーション関数を`MatchValidator`に置き換え
  - リアルタイムバリデーションの実装
  - フォーカスアウト時バリデーションの実装
  - _Requirements: 9.1_

- [x] 5.2 送信時の包括的バリデーション
  - フォーム送信時に`MatchValidator.validate()`を呼び出し
  - 全エラーの一覧表示
  - エラー項目の強調表示
  - _Requirements: 9.3, 9.4_

- [x] 6. バックエンド: バリデーション基盤の実装
- [x] 6.1 バリデーション型定義とエラーコードの作成
  - `backend/app/utils/validation_types.py`を作成
  - `ValidationResult`, `ValidationError`クラスを定義
  - `ValidationErrorCode` enumを定義
  - エラーメッセージマッピングを定義
  - _Requirements: 8, 10_

- [x] 6.2 MatchValidatorクラスの骨格実装
  - `backend/app/utils/match_validator.py`を作成
  - `MatchValidator`クラスを定義
  - 包括的バリデーションメソッド`validate()`の骨格を実装
  - _Requirements: 10, 13_

- [x] 7. バックエンド: 単一項目バリデーションの実装
- [x] 7.1 日付バリデーションの実装
  - `validate_date()`メソッドを実装
  - ISO 8601形式チェック
  - 未来日付チェック
  - 5年以上前チェック
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7.2 順位バリデーションの実装
  - `validate_rank()`メソッドを実装
  - 範囲チェック（1以上）
  - ゲームモード別上限チェック（3麻は3、4麻は4）
  - _Requirements: 1.4, 1.5_

- [x] 7.3 最終ポイントバリデーションの実装
  - `validate_final_points()`メソッドを実装
  - 範囲チェック（-999.9〜999.9）
  - 精度チェック（小数第1位まで）
  - _Requirements: 1.6, 1.7_

- [x] 7.4 素点バリデーションの実装
  - `validate_raw_score()`メソッドを実装
  - 範囲チェック（-999900〜999900）
  - 単位チェック（下2桁が00）
  - _Requirements: 1.8, 1.9_

- [x] 7.5 浮き人数バリデーションの実装
  - `validate_floating_count()`メソッドを実装
  - 範囲チェック（0以上、ゲームモード人数以下）
  - _Requirements: 1.11, 1.12_

- [x] 8. バックエンド: 複合バリデーションの実装

- [x] 8.1 入力方式とルールの整合性バリデーション
  - `validate_entry_method_consistency()`メソッドを実装
  - 固定ウマルールでの浮き人数入力チェック
  - 浮きウマルールでの浮き人数必須チェック
  - 入力方式別の必須項目チェック
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 8.2 浮き人数の存在可能性バリデーション
  - `validate_floating_count_existence()`メソッドを実装
  - 開始点=基準点での浮き人数0チェック
  - 開始点<基準点での浮き人数=ゲームモード人数チェック
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8.3 素点と浮き人数の整合性バリデーション
  - `validate_raw_score_floating_consistency()`メソッドを実装
  - 浮いているのに浮き人数0チェック
  - 沈んでいるのに全員浮きチェック
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8.4 順位と素点の関係バリデーション
  - `validate_rank_raw_score_relation()`メソッドを実装
  - 1位で浮き2人以上なのに沈みチェック
  - 最下位で浮き少ないのに浮きチェック
  - 全員浮き/全員沈みの整合性チェック
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.5 最終ポイントとルールの整合性バリデーション
  - `validate_final_points_consistency()`メソッドを実装
  - ウマ定義の存在チェック
  - 計算結果の範囲チェック
  - 計算結果の精度チェック
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8.6 トップの最終ポイント下限バリデーション
  - `validate_top_points_minimum()`メソッドを実装
  - 固定ウマルールでの下限チェック
  - 浮きウマルールでの下限チェック
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 8.7 ラスの最終ポイント上限バリデーション
  - `validate_last_points_maximum()`メソッドを実装
  - 固定ウマルールでの上限チェック
  - 浮きウマルールでの上限チェック
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. バックエンド: Pydanticモデルとの統合
- [x] 9.1 MatchRequestモデルの更新
  - `backend/app/models/match.py`の`@model_validator`を更新
  - `MatchValidator.validate()`を呼び出すように変更
  - バリデーションエラーをPydantic形式に変換
  - _Requirements: 10.2_

- [x] 9.2 APIエンドポイントのエラーハンドリング更新
  - バリデーションエラーのレスポンス形式を統一
  - HTTPステータスコード400を返す
  - エラー詳細をJSON形式で返す
  - _Requirements: 10.3, 10.4_

- [x] 10. テストデータの準備
- [x] 10.1 フロントエンドテストフィクスチャの作成
  - `frontend/src/utils/__tests__/fixtures/rulesets.ts`を作成
  - 固定ウマルールのテストデータ（3麻・4麻）
  - 浮きウマルールのテストデータ（3麻・4麻）
  - _Requirements: 11.1, 11.2_

- [x] 10.2 バックエンドテストフィクスチャの作成
  - `backend/tests/fixtures/rulesets.py`を作成
  - 固定ウマルールのテストデータ（3麻・4麻）
  - 浮きウマルールのテストデータ（3麻・4麻）
  - _Requirements: 11.1, 11.2_

- [x] 11. フロントエンド: 単一項目バリデーションのテスト
- [x] 11.1 日付バリデーションのテスト
  - `frontend/src/utils/__tests__/matchValidator.single.test.ts`を作成
  - 正常系・異常系・境界値のテストケース
  - _Requirements: 11.1, 11.2_

- [x] 11.2 順位・ポイント・素点・浮き人数バリデーションのテスト
  - 各項目の正常系・異常系・境界値のテストケース
  - _Requirements: 11.1, 11.2_

- [x] 12. フロントエンド: 複合バリデーションのテスト
- [x] 12.1 浮き人数関連の複合バリデーションテスト
  - `frontend/src/utils/__tests__/matchValidator.composite.test.ts`を作成
  - 浮き人数の存在可能性テスト
  - 素点と浮き人数の整合性テスト
  - _Requirements: 11.3_

- [x] 12.2 順位と素点の関係バリデーションテスト
  - 順位と素点の矛盾検出テスト
  - 全員同点のエッジケーステスト
  - _Requirements: 11.3_
- [x] 12.3 最終ポイント関連のバリデーションテスト
  - トップの下限チェックテスト
  - ラスの上限チェックテスト
  - _Requirements: 11.3_

- [x] 13. フロントエンド: 入力方式別バリデーションのテスト
- [x] 13.1 Mode 1（順位+最終ポイント）のテスト
  - `frontend/src/utils/__tests__/matchValidator.entryMethod.test.ts`を作成
  - 固定ウマルールでの正常入力テスト
  - 浮きウマルールでの正常入力テスト
  - トップの下限チェックテスト
  - _Requirements: 11.3_

- [x] 13.2 Mode 2（順位+素点）のテスト
  - 固定ウマルールでの正常入力テスト
  - 浮きウマルールでの正常入力テスト
  - 複合バリデーションテスト
  - _Requirements: 11.3_

- [x] 13.3 Mode 3（仮ポイント）のテスト
  - 固定ウマルールでの正常入力テスト
  - 浮きウマルールでの正常入力テスト
  - 仮ポイント計算の検証テスト
  - _Requirements: 11.3, 12.1, 12.2, 12.3, 12.4_

- [x] 14. バックエンド: 単一項目バリデーションのテスト
- [x] 14.1 日付バリデーションのテスト
  - `backend/tests/utils/test_match_validator_single.py`を作成
  - 正常系・異常系・境界値のテストケース
  - _Requirements: 11.1, 11.2, 11.5_

- [x] 14.2 順位・ポイント・素点・浮き人数バリデーションのテスト
  - 各項目の正常系・異常系・境界値のテストケース
  - _Requirements: 11.1, 11.2, 11.5_

- [x] 15. バックエンド: 複合バリデーションのテスト
- [x] 15.1 浮き人数関連の複合バリデーションテスト
  - `backend/tests/utils/test_match_validator_composite.py`を作成
  - 浮き人数の存在可能性テスト
  - 素点と浮き人数の整合性テスト
  - _Requirements: 11.3, 11.5_

- [x] 15.2 順位と素点の関係バリデーションテスト
  - 順位と素点の矛盾検出テスト
  - 全員同点のエッジケーステスト
  - _Requirements: 11.3, 11.5_

- [x] 15.3 最終ポイント関連のバリデーションテスト
  - トップの下限チェックテスト
  - ラスの上限チェックテスト
  - _Requirements: 11.3, 11.5_

- [x] 16. バックエンド: 入力方式別バリデーションのテスト
- [x] 16.1 Mode 1（順位+最終ポイント）のテスト
  - `backend/tests/utils/test_match_validator_entry_method.py`を作成
  - 固定ウマルールでの正常入力テスト
  - 浮きウマルールでの正常入力テスト
  - トップの下限チェックテスト
  - _Requirements: 11.3, 11.5_

- [x] 16.2 Mode 2（順位+素点）のテスト
  - 固定ウマルールでの正常入力テスト
  - 浮きウマルールでの正常入力テスト
  - 複合バリデーションテスト
  - _Requirements: 11.3, 11.5_

- [x] 16.3 Mode 3（仮ポイント）のテスト
  - 固定ウマルールでの正常入力テスト
  - 浮きウマルールでの正常入力テスト
  - 仮ポイント計算の検証テスト
  - _Requirements: 11.3, 11.5, 12.1, 12.2, 12.3, 12.4_

- [x] 17. バックエンド: APIエンドポイントの統合テスト
- [x] 17.1 対局登録APIのバリデーションテスト
  - `backend/tests/api/test_matches_validation.py`を作成
  - バリデーションエラー時のレスポンステスト
  - HTTPステータスコード400のテスト
  - エラー詳細のJSON形式テスト
  - _Requirements: 10.3, 10.4_

- [x] 17.2 対局更新APIのバリデーションテスト
  - バリデーションエラー時のレスポンステスト
  - _Requirements: 10.3, 10.4_

- [x] 18. ドキュメント整備



- [x] 18.1 バリデーション仕様書の最終更新


  - `spec/design/match-validation.md`の最終レビュー
  - 実装との整合性確認
  - エラーコード一覧の完成
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8_


- [x] 18.2 開発者向けガイドの作成

  - バリデーションの使い方ガイド
  - 新しいバリデーションルールの追加方法
  - トラブルシューティング
  - _Requirements: 9, 10_
