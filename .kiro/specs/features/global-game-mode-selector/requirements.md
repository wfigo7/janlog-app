# Requirements Document

## Introduction

現在、ゲームモード（3人麻雀/4人麻雀）の切り替えは各画面で独立して管理されており、タブ移動時に選択状態がリセットされる問題があります。本機能では、アプリ全体で共有されるグローバルなゲームモード選択機能を実装し、ヘッダー右側に配置することで、より直感的で一貫性のあるユーザー体験を提供します。

## Glossary

- **System**: Janlogモバイルアプリケーション（React Native/Expo）
- **Game Mode**: ゲームモード（3人麻雀または4人麻雀）
- **Global State**: アプリ全体で共有される状態管理
- **Header**: 各タブ画面上部のナビゲーションヘッダー
- **Tab Navigation**: アプリ下部のタブナビゲーション（統計、履歴、登録、ルール、プロフィール）
- **Game Mode Selector**: ゲームモード切り替えUI要素
- **Persistent State**: アプリ再起動後も保持される状態

## Requirements

### Requirement 1

**User Story:** ユーザーとして、アプリ全体で一貫したゲームモード選択状態を維持したい。タブを移動しても選択したゲームモードが保持されることで、スムーズに操作できる。

#### Acceptance Criteria

1. WHEN ユーザーがゲームモードを選択する, THEN THE System SHALL 選択されたゲームモードをアプリ全体で共有する
2. WHEN ユーザーがタブ間を移動する, THEN THE System SHALL 選択されたゲームモードを保持する
3. WHEN ユーザーがアプリを再起動する, THEN THE System SHALL 前回選択されたゲームモードを復元する
4. THE System SHALL デフォルトのゲームモードとして4人麻雀を設定する

### Requirement 2

**User Story:** ユーザーとして、ヘッダー右側でゲームモードを切り替えたい。画面のどこにいても素早くアクセスでき、現在のモードが一目で分かる。

#### Acceptance Criteria

1. THE System SHALL ヘッダー右側にゲームモード切り替えUIを表示する
2. THE System SHALL 現在選択されているゲームモードを視覚的に強調表示する
3. WHEN ユーザーがゲームモード切り替えUIをタップする, THEN THE System SHALL ゲームモードを切り替える
4. THE System SHALL コンパクトなデザインでヘッダー領域に収まるUIを提供する
5. THE System SHALL 「3麻」「4麻」のような短縮表記を使用する

### Requirement 3

**User Story:** ユーザーとして、ゲームモードに関連する画面（統計、履歴、登録、ルール管理）で切り替えUIを表示してほしい。関係ない画面では表示されないことで、UIが整理される。

#### Acceptance Criteria

1. THE System SHALL 統計画面のヘッダーにゲームモード切り替えUIを表示する
2. THE System SHALL 履歴画面のヘッダーにゲームモード切り替えUIを表示する
3. THE System SHALL 登録画面のヘッダーにゲームモード切り替えUIを表示する
4. THE System SHALL ルール管理画面のヘッダーにゲームモード切り替えUIを表示する
5. THE System SHALL プロフィール画面のヘッダーにゲームモード切り替えUIを表示しない

### Requirement 4

**User Story:** ユーザーとして、ゲームモード切り替え時に各画面のデータが自動的に更新されてほしい。手動でリロードする必要がなく、スムーズに操作できる。

#### Acceptance Criteria

1. WHEN ユーザーがゲームモードを切り替える, THEN THE System SHALL 統計画面のデータを新しいゲームモードで再取得する
2. WHEN ユーザーがゲームモードを切り替える, THEN THE System SHALL 履歴画面のデータを新しいゲームモードで再取得する
3. WHEN ユーザーがゲームモードを切り替える, THEN THE System SHALL 登録画面のフォームを新しいゲームモードで初期化する
4. WHEN ユーザーがゲームモードを切り替える, THEN THE System SHALL ルール管理画面のルールセット一覧を新しいゲームモードでフィルタリングする
5. WHEN ユーザーがゲームモードを切り替える, THEN THE System SHALL フィルター状態をリセットする
6. WHEN ユーザーがゲームモードを切り替える, THEN THE System SHALL ページネーション状態をリセットする

### Requirement 5

**User Story:** 開発者として、既存の画面内ゲームモード切り替えUIを削除したい。グローバルな切り替えに統一することで、コードの保守性が向上する。

#### Acceptance Criteria

1. THE System SHALL 統計画面から既存のGameModeTabコンポーネントを削除する
2. THE System SHALL 履歴画面から既存のGameModeTabコンポーネントを削除する
3. THE System SHALL 各画面のローカルなゲームモード状態管理を削除する
4. THE System SHALL グローバルなゲームモード状態を参照するように各画面を更新する

### Requirement 6

**User Story:** ユーザーとして、対局登録画面でもグローバルなゲームモードに従って登録したい。画面独自のゲームモード選択は不要で、ヘッダーの切り替えで統一的に操作できる。

#### Acceptance Criteria

1. THE System SHALL 対局登録画面から独立したゲームモード選択UIを削除する
2. THE System SHALL 対局登録画面でグローバルなゲームモード状態を参照する
3. WHEN ユーザーがグローバルなゲームモードを切り替える, THEN THE System SHALL 対局登録フォームを新しいゲームモードで初期化する
4. THE System SHALL 対局登録時にグローバルなゲームモード値を使用する
