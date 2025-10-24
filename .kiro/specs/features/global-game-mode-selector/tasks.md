# Implementation Plan

- [x] 1. GameModeContextの実装


  - GameModeProviderとuseGameModeフックを作成
  - AsyncStorageを使用した永続化機能を実装
  - デフォルト値として'four'を設定
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. HeaderGameModeSelectorコンポーネントの実装
  - ヘッダー右側に配置されるコンパクトなUI作成
  - 「4麻｜3麻」形式の表示
  - アクティブ状態の視覚的強調表示
  - タップでゲームモード切り替え機能
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. アプリルートレイアウトの更新
  - GameModeProviderでアプリ全体をラップ
  - 既存のプロバイダー構成を維持
  - _Requirements: 1.1_

- [ ] 4. Tab Layoutの更新
  - 各タブ画面のheaderRightオプションを設定
  - 統計・履歴・登録・ルール管理画面にHeaderGameModeSelectorを追加
  - プロフィール画面には追加しない
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5. StatsScreen（統計画面）の更新
  - ローカルなgameMode状態管理を削除
  - useGameMode()フックを使用
  - GameModeTabコンポーネントを削除
  - useEffectでgameMode変更時にデータ再取得
  - フィルター状態をリセット
  - _Requirements: 4.1, 4.5, 5.1, 5.4_

- [ ] 6. HistoryScreen（履歴画面）の更新
  - ローカルなgameMode状態管理を削除
  - useGameMode()フックを使用
  - GameModeTabコンポーネントを削除
  - useEffectでgameMode変更時にデータ再取得
  - ページネーション状態をリセット
  - _Requirements: 4.2, 4.6, 5.2, 5.4_

- [ ] 7. MatchRegistrationScreen（対局登録画面）の更新
  - useMatchFormフック内でuseGameMode()を使用
  - MatchForm内のGameModeTabコンポーネントを削除
  - useEffectでgameMode変更時にフォームを初期化
  - ルールセット選択をクリア
  - _Requirements: 4.3, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [ ] 8. RulesScreen（ルール管理画面）の更新
  - useGameMode()フックを使用
  - useEffectでgameMode変更時にルール一覧を再取得
  - グローバルルールと個人ルールをgameModeでフィルタリング
  - _Requirements: 4.4_

- [ ] 9. 動作確認とテスト
  - 各画面でゲームモード切り替えが正常に動作することを確認
  - タブ移動時に状態が保持されることを確認
  - アプリ再起動後に状態が復元されることを確認
  - データ再取得とフォーム初期化が正常に動作することを確認
  - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 4.4_
