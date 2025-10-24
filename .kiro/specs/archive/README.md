# Archive - 完了したSpec

## 概要

このディレクトリは、完了したspecを目的別に分類して保管します。過去の意思決定や実装パターンを参照する際に活用できます。

## ディレクトリ構造

```
archive/
├── README.md                      # 本ファイル
├── features/                      # 完了した新機能spec
│   └── mahjong-score-management/  # 初期MVP
├── improvements/                  # 完了した開発改善spec
│   ├── makefile-improvements/
│   ├── backend-test-data-management/
│   └── spec-management/
└── bugfix/                        # 完了したバグ修正spec
    └── react-native-buffer-polyfill/
```

## 完了判定基準

### features/の場合
1. tasks.mdの全タスクが完了（[x]マーク）
2. core/requirements.mdとcore/design.mdに統合済み
3. 統合内容のレビュー完了

### improvements/の場合
1. tasks.mdの全タスクが完了（[x]マーク）
2. core統合が必要な場合は統合済み
3. 関連ドキュメント（README.md、steering等）の更新完了

### bugfix/の場合
1. tasks.mdの全タスクが完了（[x]マーク）
2. 必要に応じてcore/の該当箇所を更新済み
3. 修正内容のテスト完了

## Archive移動手順

### 1. 完了確認
- tasks.mdの全タスクが[x]になっているか確認
- core統合が必要な場合は完了しているか確認
- 関連ドキュメントの更新が完了しているか確認

### 2. Git履歴を保持して移動

```bash
# features/の場合
git mv .kiro/specs/features/{spec-name} .kiro/specs/archive/features/

# improvements/の場合
git mv .kiro/specs/improvements/{spec-name} .kiro/specs/archive/improvements/

# bugfix/の場合
git mv .kiro/specs/bugfix/{spec-name} .kiro/specs/archive/bugfix/
```

### 3. コミット

```bash
git commit -m "archive: {spec-name}を完了としてarchiveに移動"
```

## 参照方法

### Kiroへの指示例

```
「archive/features/mahjong-score-managementの設計を参照して」
「archive/improvements/makefile-improvementsの実装パターンを参考にして」
```

### 検索のヒント

- **カテゴリ別検索**: features/improvements/bugfix配下を探索
- **機能名検索**: `find .kiro/specs/archive -name "*venue*"`
- **日付検索**: Git履歴で移動日時を確認
- **内容検索**: `grep -r "キーワード" .kiro/specs/archive/`

## 活用方法

### 過去の実装パターンの参照
完了したspecの設計やタスク分割を参考に、類似機能の開発を効率化できます。

### 新規メンバーのオンボーディング
初期MVPから現在までの開発履歴を追うことで、プロジェクトの成長過程を理解できます。

### トラブルシューティング
過去の修正内容を参照して、類似問題の解決策を見つけることができます。

### 設計決定の振り返り
なぜその設計を選択したのか、requirements.mdとdesign.mdから意思決定の背景を確認できます。

## 注意事項

- **変更禁止**: archive配下のspecは原則として変更しません
- **参照のみ**: 過去の記録として保持し、参照用途に限定します
- **Git履歴**: git mvで移動しているため、Git履歴で変更履歴を追跡できます
- **削除禁止**: 古いspecでも削除せず、履歴として保持します

## 関連ドキュメント

- **Spec管理体系**: `.kiro/specs/README.md`
- **Steering設定**: `.kiro/steering/spec-management.md`
- **Core統合仕様**: `.kiro/specs/core/`
