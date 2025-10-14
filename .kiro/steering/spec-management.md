---
inclusion: always
---

# Spec管理運用ルール

このファイルは、Kiroが自動的にspec管理体系を理解し、適切な仕様を参照できるようにするためのステアリングファイルです。

## ディレクトリ構造

```
.kiro/specs/
├── README.md                          # spec管理体系の全体説明
├── core/                              # 統合仕様（マスター）
│   ├── README.md                      # core/の役割と更新方針
│   ├── requirements.md                # 全体要件の統合版
│   ├── design.md                      # 全体設計の統合版
│   └── architecture.md                # システム全体のアーキテクチャ
├── features/                          # 新機能追加spec
│   ├── README.md                      # features/の使い方
│   └── {feature-name}/                # 個別機能spec
├── improvements/                      # 開発改善spec
│   ├── README.md                      # improvements/の使い方
│   ├── makefile-improvements/         # Makefile改善
│   ├── backend-test-data-management/  # テストデータ管理
│   └── spec-management/               # 本spec（自己参照）
├── bugfix/                            # バグ修正spec
│   ├── README.md                      # bugfix/の使い方
│   └── react-native-buffer-polyfill/  # Buffer polyfill修正
└── archive/                           # 完了したspec
    ├── README.md                      # archive/の参照方法
    └── mahjong-score-management/      # 初期MVP（参照用）
```

## 運用フロー

### 新機能追加（features/）

1. **Spec作成**
   ```
   mkdir -p .kiro/specs/features/{feature-name}
   ```

2. **要件・設計・タスク作成**
   - requirements.md作成
   - design.md作成
   - tasks.md作成・実行

3. **Core統合**
   - タスク完了後、core/に該当セクションを追加
   - 既存セクションは変更せず、新規セクションを追加

4. **アーカイブ**
   ```bash
   git mv .kiro/specs/features/{feature-name} .kiro/specs/archive/
   ```

### 開発改善（improvements/）

1. **Spec作成**
   ```
   mkdir -p .kiro/specs/improvements/{improvement-name}
   ```

2. **要件・設計・タスク作成**
   - requirements.md作成
   - design.md作成
   - tasks.md作成・実行

3. **Core統合（任意）**
   - アーキテクチャに影響する場合のみcore/に統合
   - 開発環境改善は基本的に統合不要

4. **アーカイブ**
   ```bash
   git mv .kiro/specs/improvements/{improvement-name} .kiro/specs/archive/
   ```

### バグ修正（bugfix/）

1. **Spec作成**
   ```
   mkdir -p .kiro/specs/bugfix/{bug-name}
   ```

2. **要件・設計・タスク作成**
   - requirements.md作成（バグの現象・原因・修正要件）
   - design.md作成（修正方針・実装方法）
   - tasks.md作成・実行

3. **Core更新（必要に応じて）**
   - 設計の根本的な問題による修正の場合はcore/を更新
   - 単純なバグ修正は統合不要

4. **アーカイブ**
   ```bash
   git mv .kiro/specs/bugfix/{bug-name} .kiro/specs/archive/
   ```

## Kiroへの指示方法

### 統合仕様を参照した実装

```
「core/requirements.mdを参照して、対局登録機能を実装して」
```

### 個別specのタスク実行

```
「features/venue-managementのタスク3を実行」
「improvements/makefile-improvementsのタスク1を実行」
「bugfix/cognito-auth-errorのタスク2を実行」
```

### 新規spec作成

```
「会場管理機能の新機能specを作成して」
→ features/venue-management/を作成し、requirements.md作成から開始

「テストカバレッジ改善のspecを作成して」
→ improvements/test-coverage/を作成

「認証エラーのバグ修正specを作成して」
→ bugfix/cognito-auth-error/を作成
```

### Core統合

```
「features/venue-managementをcore/に統合して」
→ core/requirements.mdとcore/design.mdに該当セクションを追加
```

### Archive参照

```
「archive/mahjong-score-managementの設計を参照して」
→ 過去のspecを参照して実装
```

## 命名規則

### ディレクトリ名
- **形式**: kebab-case
- **例**: `venue-management`, `makefile-improvements`, `react-native-buffer-polyfill`

### ファイル名
- **requirements.md**: 要件書
- **design.md**: 設計書
- **tasks.md**: 実装タスク

## Core統合の判断基準

### 必ず統合が必要
- 新機能追加（features/）
- アーキテクチャ変更を伴う改善
- データモデル変更を伴う修正
- API仕様変更を伴う修正

### 統合不要
- ローカル開発環境の改善
- 個別ツール・スクリプトの追加
- テストデータ管理
- 単純なバグ修正
- 環境依存の問題修正

### 判断が必要
- 開発フローの標準化
- テスト基盤の整備
- CI/CD改善
- ドキュメント整備

## 自動参照設定

Kiroは以下のcore/配下のファイルを自動的に参照します：

#[[file:../specs/core/requirements.md]]

#[[file:../specs/core/design.md]]

#[[file:../specs/core/architecture.md]]

## 注意事項

### Single Source of Truth
- **core/が常に最新**: 全ての機能追加・変更はcore/に反映
- **詳細は個別specに**: core/は概要のみ、詳細は個別specに記載
- **履歴はarchiveに**: 完了したspecはarchiveで参照可能

### 段階的統合
- **手動マージ**: 機能完了後に手動でcore/にマージ
- **自動マージなし**: 自動マージは行わない（整合性確保のため）
- **影響範囲確認**: 既存機能への影響を慎重に確認

### Git履歴の保持
- **git mv使用**: spec移動時はgit mvで履歴を保持
- **コミットメッセージ**: 移動理由を明記

### ドキュメントの保守
- **生きたドキュメント**: core/は常に最新の状態を保つ
- **定期的な見直し**: 古い情報は更新または削除
- **参照リンクの確認**: ファイル移動時は参照リンクを更新

## トラブルシューティング

### Specが見つからない
1. `.kiro/specs/`配下の全ディレクトリを確認
2. archiveに移動していないか確認
3. Git履歴で移動履歴を確認

### Core統合の判断に迷う
1. 影響範囲を確認（アーキテクチャ、データモデル、API仕様）
2. 他の開発者への影響を考慮
3. 迷ったら統合する方向で判断

### 既存specとの整合性
1. core/の該当セクションを確認
2. 既存設計との矛盾がないか確認
3. 必要に応じて設計変更のspecを作成

## 関連ドキュメント

- **Core統合仕様**: `.kiro/specs/core/`
- **Spec管理体系**: `.kiro/specs/README.md`
- **ADR**: `/spec/adr/`
- **プロジェクトコンテキスト**: `/spec/context.md`
