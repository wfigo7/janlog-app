# コミットメッセージ規約 - 実装タスク

- [ ] 1. コミットメッセージ規約ドキュメントの作成
  - プロジェクトルートに`COMMIT_CONVENTION.md`を作成
  - Conventional Commitsの概要を説明
  - コミットタイプとスコープの定義と使用例を記載
  - 良い例と悪い例を示す
  - 破壊的変更の記述方法を説明
  - 規約導入日を明記
  - _要件: 要件7_

- [ ] 2. commitlintとhuskyのセットアップ
  - [ ] 2.1 依存関係のインストール
    - プロジェクトルートに`package.json`を作成（存在しない場合）
    - `@commitlint/cli`、`@commitlint/config-conventional`、`husky`をインストール
    - _要件: 要件6_
  
  - [ ] 2.2 commitlint設定ファイルの作成
    - `.commitlintrc.json`を作成
    - コミットタイプとスコープのルールを定義
    - ヘッダーの最大長を100文字に設定
    - 日本語対応のため`subject-case`ルールを無効化
    - _要件: 要件6_
  
  - [ ] 2.3 huskyのセットアップ
    - `npx husky init`を実行
    - `.husky/commit-msg`フックを作成
    - commitlintを実行するスクリプトを追加
    - _要件: 要件6_

- [ ] 3. package.jsonスクリプトの追加
  - `commitlint`コマンドをスクリプトに追加
  - `prepare`スクリプトでhuskyをインストール
  - _要件: 要件6_

- [ ] 4. README.mdの更新
  - コミットメッセージ規約のセクションを追加
  - `COMMIT_CONVENTION.md`へのリンクを追加
  - 規約の概要を簡潔に説明
  - _要件: 要件7_

- [ ] 5. .gitignoreの更新
  - `node_modules/`を追加（プロジェクトルートのpackage.json用）
  - `.husky/_`を除外しないように確認
  - _要件: 要件6_

- [ ]* 6. CI/CDでのバリデーション
  - [ ]* 6.1 GitHub Actionsワークフローの作成
    - `.github/workflows/commitlint.yml`を作成
    - プルリクエスト時にコミットメッセージをバリデーション
    - _要件: 要件6_

- [ ] 7. 規約導入のマーカーコミット
  - 規約導入を示すコミットを作成
  - コミットメッセージ: `docs: コミットメッセージ規約を導入`
  - 本文に規約の概要と適用開始日を記載
  - _要件: 要件8_

- [ ]* 8. CHANGELOGの自動生成設定
  - [ ]* 8.1 standard-versionのインストール
    - `standard-version`をdevDependenciesに追加
    - _要件: なし（将来の拡張）_
  
  - [ ]* 8.2 package.jsonスクリプトの追加
    - `release`スクリプトを追加
    - `CHANGELOG.md`の自動生成を設定
    - _要件: なし（将来の拡張）_
