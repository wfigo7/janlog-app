# コミットメッセージ規約 - 設計書

## 概要

Janlogプロジェクトに[Conventional Commits 1.0.0](https://www.conventionalcommits.org/)仕様に準拠したコミットメッセージ規約を導入します。commitlintとhuskyを使用して、コミット時に自動的にバリデーションを行います。

## Conventional Commitsとは

Conventional Commitsは、コミットメッセージに構造化された規約を提供する仕様です。

**メリット:**
- 変更履歴の可読性向上
- CHANGELOGの自動生成
- セマンティックバージョニングの自動化
- コードレビューの効率化
- 変更の影響範囲の明確化

## コミットメッセージの構造

### 基本フォーマット

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 例

```
feat(frontend): ユーザープロフィール画面を追加

ユーザーが自分のプロフィール情報を確認・編集できる画面を実装。
- 表示名の編集
- メールアドレスの表示
- ログアウト機能

Refs: #123
```

## コミットタイプ

### 定義

| タイプ | 説明 | バージョン影響 | 例 |
|--------|------|---------------|-----|
| `feat` | 新機能の追加 | MINOR | 会場管理機能の追加 |
| `fix` | バグ修正 | PATCH | 対局登録時のバリデーションエラー修正 |
| `docs` | ドキュメントのみの変更 | なし | README.mdの更新 |
| `style` | コードの意味に影響しない変更 | なし | インデント修正、セミコロン追加 |
| `refactor` | バグ修正や機能追加を伴わないコード改善 | なし | 関数の分割、変数名の変更 |
| `perf` | パフォーマンス改善 | PATCH | クエリの最適化 |
| `test` | テストの追加・修正 | なし | ユニットテストの追加 |
| `chore` | ビルドプロセスやツールの変更 | なし | 依存関係の更新、設定ファイルの変更 |
| `ci` | CI/CD設定の変更 | なし | GitHub Actionsワークフローの更新 |
| `revert` | 以前のコミットの取り消し | 元のコミットに依存 | "revert: feat(frontend): ユーザープロフィール画面を追加" |

### タイプ選択ガイドライン

**迷った時の判断基準:**

1. **ユーザーに見える変更？**
   - Yes → `feat`（新機能）または`fix`（バグ修正）
   - No → 次へ

2. **コードの動作が変わる？**
   - Yes → `refactor`（リファクタリング）または`perf`（パフォーマンス）
   - No → 次へ

3. **テストコードのみ？**
   - Yes → `test`
   - No → 次へ

4. **ドキュメントのみ？**
   - Yes → `docs`
   - No → `chore`（その他）

## スコープ

### 定義

| スコープ | 説明 | 例 |
|---------|------|-----|
| `frontend` | フロントエンド関連 | React Nativeコンポーネント、画面、hooks |
| `backend` | バックエンド関連 | FastAPI、サービス、モデル |
| `infra` | インフラストラクチャ関連 | AWS CDK、Lambda、DynamoDB |
| `api` | API仕様の変更 | OpenAPI仕様、エンドポイント |
| `db` | データベーススキーマ | DynamoDBテーブル設計、GSI |
| `auth` | 認証・認可関連 | Cognito、JWT、権限管理 |
| `ui` | UI/UX関連 | デザイン、スタイル、レイアウト |
| `deps` | 依存関係の更新 | npm、pip、パッケージ更新 |

### スコープの使用例

```
feat(frontend): 対局登録画面を追加
fix(backend): 統計計算のバグを修正
docs(api): OpenAPI仕様を更新
chore(deps): React Nativeを0.79.6に更新
```

### スコープ省略の判断

**スコープを省略できる場合:**
- プロジェクト全体に影響する変更（例: `chore: バージョンを0.2.0に更新`）
- 複数のスコープにまたがる変更（例: `feat: 会場管理機能を追加`）
- スコープが自明な場合（例: `docs: CONTRIBUTING.mdを追加`）

## コミットメッセージの詳細

### ヘッダー（必須）

**ルール:**
- 50文字以内
- 小文字で開始
- 末尾にピリオドを付けない
- 命令形を使用（「追加する」ではなく「追加」）

**良い例:**
```
feat(frontend): ユーザープロフィール画面を追加
fix(backend): 対局削除時のエラーを修正
docs: コミットメッセージ規約を追加
```

**悪い例:**
```
feat(frontend): ユーザープロフィール画面を追加しました。  # 過去形、ピリオド
Fix(Backend): 対局削除時のエラーを修正  # 大文字
frontend: ユーザープロフィール画面  # タイプなし
```

### 本文（オプション）

**ルール:**
- ヘッダーの後に空行を入れる
- 72文字で改行
- 「何を」「なぜ」変更したかを説明
- 「どのように」は必要に応じて

**例:**
```
feat(frontend): ユーザープロフィール画面を追加

ユーザーが自分のプロフィール情報を確認・編集できる画面を実装。
これにより、ユーザーは表示名を変更したり、アカウント情報を
確認したりできるようになる。

実装内容:
- 表示名の編集機能
- メールアドレスの表示
- ログアウト機能
- バージョン情報の表示
```

### フッター（オプション）

**ルール:**
- 本文の後に空行を入れる
- `Key: Value`形式
- 複数のフッターを記載可能

**フッターの種類:**

1. **Issue参照:**
   ```
   Refs: #123
   Closes: #456
   Fixes: #789
   ```

2. **破壊的変更:**
   ```
   BREAKING CHANGE: APIエンドポイントのパスを変更
   
   /api/matches から /api/v1/matches に変更しました。
   クライアントコードを更新してください。
   ```

3. **レビュアー:**
   ```
   Reviewed-by: John Doe <john@example.com>
   ```

4. **共同作成者:**
   ```
   Co-authored-by: Jane Smith <jane@example.com>
   ```

## 破壊的変更

### 記述方法

**方法1: BREAKING CHANGEフッター**
```
feat(api): エンドポイントパスを変更

APIのバージョニングを導入し、全てのエンドポイントに
/api/v1 プレフィックスを追加。

BREAKING CHANGE: 全てのAPIエンドポイントのパスが変更されました

以前: /matches
現在: /api/v1/matches

クライアントコードを更新してください。
```

**方法2: !接尾辞**
```
feat(api)!: エンドポイントパスを変更

APIのバージョニングを導入し、全てのエンドポイントに
/api/v1 プレフィックスを追加。

BREAKING CHANGE: 全てのAPIエンドポイントのパスが変更されました
```

### 破壊的変更の例

- APIの非互換変更
- データベーススキーマの変更
- 環境変数の変更
- 設定ファイルフォーマットの変更
- 依存関係のメジャーバージョンアップ

## バリデーション

### ツール構成

```
┌─────────────┐
│   Git Hook  │
│   (husky)   │
└──────┬──────┘
       │ commit-msg
       ▼
┌─────────────┐
│ commitlint  │
│   + config  │
└──────┬──────┘
       │ validate
       ▼
┌─────────────┐
│   Success   │
│  or Reject  │
└─────────────┘
```

### commitlint設定

**インストール:**
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
npm install --save-dev husky
```

**設定ファイル（.commitlintrc.json）:**
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "ci",
        "revert"
      ]
    ],
    "scope-enum": [
      2,
      "always",
      [
        "frontend",
        "backend",
        "infra",
        "api",
        "db",
        "auth",
        "ui",
        "deps"
      ]
    ],
    "scope-empty": [0],
    "subject-case": [0],
    "header-max-length": [2, "always", 100]
  }
}
```

### husky設定

**初期化:**
```bash
npx husky init
```

**commit-msgフック（.husky/commit-msg）:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

### バリデーションエラーの例

**エラー:**
```
⧗   input: Add user profile screen
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
```

**修正後:**
```
feat(frontend): ユーザープロフィール画面を追加
```

## 実装例

### 良いコミットメッセージの例

**1. シンプルな機能追加:**
```
feat(frontend): 会場選択機能を追加
```

**2. バグ修正:**
```
fix(backend): 対局削除時の権限チェックを修正

管理者以外のユーザーが他人の対局を削除できてしまう
バグを修正。ユーザーIDの検証を追加。

Fixes: #234
```

**3. ドキュメント更新:**
```
docs: コミットメッセージ規約を追加

Conventional Commitsに準拠したコミットメッセージ規約を
COMMIT_CONVENTION.mdに文書化。

Refs: .kiro/specs/improvements/commit-message-convention/
```

**4. リファクタリング:**
```
refactor(backend): 統計計算ロジックを分離

StatsServiceの肥大化を防ぐため、計算ロジックを
別モジュールに分離。機能は変更なし。
```

**5. 破壊的変更:**
```
feat(api)!: 認証方式をJWTに変更

セキュリティ向上のため、セッションベースからJWTベースの
認証に変更。

BREAKING CHANGE: 認証方式が変更されました

クライアントは新しい認証フローに対応する必要があります。
詳細は docs/authentication.md を参照してください。
```

**6. 依存関係更新:**
```
chore(deps): React Nativeを0.79.6に更新

セキュリティパッチとパフォーマンス改善を含む。
```

**7. CI/CD変更:**
```
ci: GitHub Actionsワークフローを追加

バックエンドの自動デプロイワークフローを追加。
mainブランチへのプッシュ時に自動的にdevelopment環境に
デプロイされる。
```

### 悪いコミットメッセージの例

**1. タイプなし:**
```
❌ ユーザープロフィール画面を追加
✅ feat(frontend): ユーザープロフィール画面を追加
```

**2. 曖昧な説明:**
```
❌ fix: バグ修正
✅ fix(backend): 対局削除時の権限チェックを修正
```

**3. 複数の変更を1つのコミットに:**
```
❌ feat: ユーザープロフィール画面を追加とバグ修正
✅ 2つのコミットに分割:
   feat(frontend): ユーザープロフィール画面を追加
   fix(backend): 対局削除時の権限チェックを修正
```

**4. 過去形:**
```
❌ feat(frontend): ユーザープロフィール画面を追加しました
✅ feat(frontend): ユーザープロフィール画面を追加
```

## CHANGELOGとの連携

### 自動生成

commitlintと組み合わせて、CHANGELOGを自動生成できます。

**ツール:**
- `standard-version`: セマンティックバージョニング + CHANGELOG生成
- `conventional-changelog`: CHANGELOG生成のみ

**例（standard-version）:**
```bash
npm install --save-dev standard-version

# package.jsonに追加
{
  "scripts": {
    "release": "standard-version"
  }
}

# 実行
npm run release
```

**生成されるCHANGELOG.md:**
```markdown
# Changelog

## [0.2.0](https://github.com/user/janlog/compare/v0.1.0...v0.2.0) (2025-01-17)

### Features

* **frontend:** ユーザープロフィール画面を追加 ([abc1234](https://github.com/user/janlog/commit/abc1234))
* **frontend:** 会場選択機能を追加 ([def5678](https://github.com/user/janlog/commit/def5678))

### Bug Fixes

* **backend:** 対局削除時の権限チェックを修正 ([ghi9012](https://github.com/user/janlog/commit/ghi9012))
```

## 既存コミット履歴の扱い

### 方針

1. **既存のコミットは変更しない**
   - rebaseやamendは行わない
   - 履歴の改変はリスクが高い

2. **新しい規約は今後のコミットから適用**
   - 規約導入日以降のコミットに適用
   - 過去のコミットは参考程度

3. **移行期間**
   - 規約導入後1ヶ月は警告のみ
   - その後、バリデーションエラーでコミット拒否

### 規約導入のマーカー

規約導入を示すコミット:
```
docs: コミットメッセージ規約を導入

Conventional Commitsに準拠したコミットメッセージ規約を導入。
このコミット以降、全てのコミットは規約に従う必要がある。

Refs: .kiro/specs/improvements/commit-message-convention/
```

## トラブルシューティング

### よくある問題

**1. バリデーションエラーが出る**
```
✖   type may not be empty [type-empty]
```
→ コミットメッセージにタイプを追加

**2. スコープが認識されない**
```
✖   scope must be one of [frontend, backend, ...] [scope-enum]
```
→ 定義されたスコープを使用するか、スコープを省略

**3. ヘッダーが長すぎる**
```
✖   header must not be longer than 100 characters [header-max-length]
```
→ ヘッダーを短縮し、詳細は本文に記載

**4. huskyが動作しない**
```bash
# Git hooksを再インストール
npx husky install
```

## 関連ドキュメント

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [commitlint](https://commitlint.js.org/)
- [husky](https://typicode.github.io/husky/)
- [Semantic Versioning 2.0.0](https://semver.org/)
