# Requirements Document

## Introduction

現在のCognito招待フローには、ユーザー体験上の重大な問題が2つ存在します。管理者がAdminCreateUser APIでユーザーを招待した際、Cognitoから送信される招待メールには最低限の情報しか含まれておらず、アプリへのアクセスURLが記載されていません。また、一時パスワードでログインした新規ユーザーは、パスワード変更を強制されますが、フロントエンドにパスワード変更画面が実装されていないため、ログインできない状態になります。

本要件は、これらの問題を解決し、スムーズな招待フローを実現することを目的とします。

## Glossary

- **Janlog System**: 麻雀成績管理モバイルアプリケーション
- **Cognito User Pool**: AWS Cognitoによるユーザー認証サービス
- **AdminCreateUser API**: Cognito管理者APIによるユーザー作成機能
- **Temporary Password**: Cognitoが自動生成する一時パスワード
- **Password Challenge**: Cognitoが要求する初回パスワード変更フロー
- **Invitation Email**: ユーザー招待時にCognitoから送信されるメール
- **Custom Email Template**: Cognitoのカスタムメールテンプレート機能
- **Password Change Screen**: 初回ログイン時のパスワード変更画面

## Requirements

### Requirement 1

**User Story:** 管理者として、新規ユーザーを招待した際に、ユーザーがアプリにアクセスできるよう適切な情報を提供したい

#### Acceptance Criteria

1. WHEN 管理者がAdminCreateUser APIでユーザーを作成する、THEN THE Janlog System SHALL Cognitoのカスタムメールテンプレートを使用して招待メールを送信する
2. THE Invitation Email SHALL アプリのダウンロードURLまたはアクセスURLを含む
3. THE Invitation Email SHALL 一時パスワードを含む
4. THE Invitation Email SHALL 初回ログイン手順を明確に説明する
5. WHERE development環境、THE Invitation Email SHALL Expo Go経由のアクセス方法を説明する

### Requirement 2

**User Story:** 新規ユーザーとして、一時パスワードでログインした後、新しいパスワードを設定できるようにしたい

#### Acceptance Criteria

1. WHEN ユーザーが一時パスワードでログインを試みる、THEN THE Janlog System SHALL Password Challengeを検出する
2. WHEN Password Challengeが検出される、THEN THE Janlog System SHALL Password Change Screenを表示する
3. THE Password Change Screen SHALL 新しいパスワードの入力フィールドを提供する
4. THE Password Change Screen SHALL 新しいパスワードの確認入力フィールドを提供する
5. THE Password Change Screen SHALL Cognitoのパスワードポリシーを表示する
6. WHEN ユーザーが新しいパスワードを入力する、THEN THE Janlog System SHALL パスワードポリシーに準拠しているか検証する
7. WHEN パスワード変更が成功する、THEN THE Janlog System SHALL 自動的にログイン状態にする

### Requirement 3

**User Story:** 新規ユーザーとして、パスワード設定時にエラーが発生した場合、適切なフィードバックを受け取りたい

#### Acceptance Criteria

1. WHEN 新しいパスワードがポリシーに違反する、THEN THE Janlog System SHALL 具体的なエラーメッセージを表示する
2. WHEN 新しいパスワードと確認パスワードが一致しない、THEN THE Janlog System SHALL 不一致エラーメッセージを表示する
3. WHEN パスワード変更APIがエラーを返す、THEN THE Janlog System SHALL ユーザーフレンドリーなエラーメッセージを表示する
4. THE Janlog System SHALL エラー発生時もユーザーが再試行できる状態を維持する

### Requirement 4

**User Story:** 開発者として、local環境でも招待フローをテストできるようにしたい

#### Acceptance Criteria

1. WHERE local環境、THE Janlog System SHALL 静的JWT認証を使用する
2. WHERE local環境、THE Janlog System SHALL Password Challengeフローをスキップする
3. WHERE development環境またはproduction環境、THE Janlog System SHALL 実際のCognito認証フローを使用する
4. THE Janlog System SHALL 環境ごとの認証フロー差異をドキュメント化する

### Requirement 5

**User Story:** 管理者として、招待メールのテンプレートを環境ごとにカスタマイズしたい

#### Acceptance Criteria

1. THE Janlog System SHALL development環境用のメールテンプレートを提供する
2. THE Janlog System SHALL production環境用のメールテンプレートを提供する
3. WHERE development環境、THE Invitation Email SHALL Expo Goのアクセス方法を含む
4. WHERE production環境、THE Invitation Email SHALL App Store/Google Playのダウンロードリンクを含む
5. THE Janlog System SHALL メールテンプレートをCDKで管理する

### Requirement 6

**User Story:** ログイン済みユーザーとして、いつでも自分のパスワードを変更できるようにしたい

#### Acceptance Criteria

1. THE Janlog System SHALL ユーザープロフィール画面にパスワード変更オプションを提供する
2. WHEN ユーザーがパスワード変更を選択する、THEN THE Janlog System SHALL パスワード変更画面を表示する
3. THE Password Change Screen SHALL 現在のパスワード入力フィールドを提供する
4. THE Password Change Screen SHALL 新しいパスワード入力フィールドを提供する
5. THE Password Change Screen SHALL 新しいパスワード確認入力フィールドを提供する
6. WHEN ユーザーがパスワード変更を実行する、THEN THE Janlog System SHALL Cognitoのパスワード変更APIを呼び出す
7. WHEN パスワード変更が成功する、THEN THE Janlog System SHALL 成功メッセージを表示する
8. WHEN パスワード変更が成功する、THEN THE Janlog System SHALL ログイン状態を維持する

### Requirement 7

**User Story:** ログイン済みユーザーとして、パスワード変更時に適切なセキュリティ検証を受けたい

#### Acceptance Criteria

1. WHEN 現在のパスワードが間違っている、THEN THE Janlog System SHALL 認証エラーメッセージを表示する
2. WHEN 新しいパスワードがポリシーに違反する、THEN THE Janlog System SHALL ポリシー違反の詳細を表示する
3. WHEN 新しいパスワードと確認パスワードが一致しない、THEN THE Janlog System SHALL 不一致エラーメッセージを表示する
4. WHEN 新しいパスワードが現在のパスワードと同じ、THEN THE Janlog System SHALL 同一パスワードエラーメッセージを表示する
5. THE Janlog System SHALL パスワード入力フィールドをマスク表示する
6. THE Janlog System SHALL パスワード表示/非表示の切り替え機能を提供する
