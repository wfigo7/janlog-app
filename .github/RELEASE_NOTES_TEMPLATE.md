# Janlog リリースノートテンプレート

このファイルは、GitHubリリース作成時のテンプレートです。
各リリース時に、このテンプレートをベースにCHANGELOG.mdの内容を反映してリリースノートを作成してください。

---

## バージョン {VERSION} - {RELEASE_TITLE}

**リリース日:** {RELEASE_DATE}

### 概要

{このリリースの概要を1-2文で記載}

### 主要な変更

#### 追加機能 (Added)
{CHANGELOG.mdの[Added]セクションから転記}

#### 変更 (Changed)
{CHANGELOG.mdの[Changed]セクションから転記}

#### 修正 (Fixed)
{CHANGELOG.mdの[Fixed]セクションから転記}

#### 削除 (Removed)
{CHANGELOG.mdの[Removed]セクションから転記（該当する場合）}

#### 非推奨 (Deprecated)
{CHANGELOG.mdの[Deprecated]セクションから転記（該当する場合）}

### 技術的な変更

{インフラ、アーキテクチャ、依存関係の変更があれば記載}

### 破壊的変更

{破壊的変更がある場合は、移行ガイドとともに記載}

### 既知の問題

{既知の問題や制限事項があれば記載}

### アップグレード方法

{ユーザーがアップグレードする際の手順や注意事項}

### フィードバック

バグ報告や機能要望は、[GitHubのIssues](https://github.com/wfigo7/janlog-app/issues)までお願いします。

---

詳細な変更履歴は[CHANGELOG.md](https://github.com/wfigo7/janlog-app/blob/main/CHANGELOG.md)を参照してください。

---

## テンプレート使用例（v0.1.0）

以下は、v0.1.0リリース時の実際の例です。

---

## バージョン 0.1.0 - 初期MVPリリース

**リリース日:** 2025年1月17日

### 概要

Janlogの初期MVPバージョンをリリースしました。フリー雀荘やセット麻雀の成績を個人用に記録・集計できるモバイルアプリです。

### 主要な変更

#### 追加機能 (Added)
- 対局記録機能（3人麻雀・4人麻雀対応）
- 3つの入力方式（順位+最終ポイント、順位+素点、仮ポイント）
- 成績統計表示（対局数、平均順位、トップ率、ラス率、累積ポイント、チップ合計）
- ルールセット管理（ウマ・オカ設定）
- Cognito招待制ユーザー認証
- バージョン管理体系の確立

### 技術的な変更

- **フロントエンド:** Expo (React Native)
- **バックエンド:** FastAPI on Lambda Web Adapter
- **データベース:** DynamoDB シングルテーブル設計
- **認証:** Amazon Cognito User Pool
- **インフラ:** AWS CDK
- **環境分離:** local/development/production

### 既知の問題

- プレリリース段階（バージョン0.x.y）のため、APIの変更が発生する可能性があります
- 個人の成績のみ管理（他人の成績は管理しません）
- 3人麻雀・4人麻雀の成績は混ぜません

### アップグレード方法

初回リリースのため、アップグレード手順はありません。

### フィードバック

バグ報告や機能要望は、[GitHubのIssues](https://github.com/wfigo7/janlog-app/issues)までお願いします。

---

詳細な変更履歴は[CHANGELOG.md](https://github.com/wfigo7/janlog-app/blob/main/CHANGELOG.md)を参照してください。
