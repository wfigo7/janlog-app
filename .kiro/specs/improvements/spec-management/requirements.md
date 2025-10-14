# 要件書

## 概要

Kiroのspec管理体系を整理し、機能追加・バグ修正・開発改善を効率的に管理できる構造を構築する。現在の`mahjong-score-management`を基準として、今後の開発で仕様のブレを防ぎ、統合された「正」の仕様を維持できる運用体制を確立する。

## 要件

### 要件 1

**ユーザーストーリー:** 開発者として、統合された「正」の仕様を一箇所で管理したいので、機能追加時に既存仕様との整合性を保ちながら開発できる

#### 受入基準

1. WHEN `.kiro/specs/core/`ディレクトリが作成された時 THEN システムは統合仕様の管理場所として機能する
2. WHEN `core/requirements.md`が作成された時 THEN システムは全体要件の統合版を提供する
3. WHEN `core/design.md`が作成された時 THEN システムは全体設計の統合版を提供する
4. WHEN `core/architecture.md`が作成された時 THEN システムはシステム全体のアーキテクチャ情報を提供する
5. WHEN 開発者がKiroに指示する時 THEN `core/`配下のファイルを参照することで最新の統合仕様に基づいた実装ができる

### 要件 2

**ユーザーストーリー:** 開発者として、spec作業をカテゴリ別に分類したいので、作業の性質に応じた適切な管理ができる

#### 受入基準

1. WHEN `.kiro/specs/features/`ディレクトリが作成された時 THEN システムは新機能追加のspec管理場所として機能する
2. WHEN `.kiro/specs/improvements/`ディレクトリが作成された時 THEN システムは開発改善のspec管理場所として機能する
3. WHEN `.kiro/specs/bugfix/`ディレクトリが作成された時 THEN システムはバグ修正のspec管理場所として機能する
4. WHEN `.kiro/specs/archive/`ディレクトリが作成された時 THEN システムは完了したspecの保管場所として機能する
5. WHEN 開発者が新しいspecを作成する時 THEN 適切なカテゴリディレクトリ配下に配置できる

### 要件 3

**ユーザーストーリー:** 開発者として、既存のspecを適切なカテゴリに再配置したいので、新しい管理体系に移行できる

#### 受入基準

1. WHEN `mahjong-score-management`が`archive/`に移動された時 THEN システムは初期MVP仕様を参照用として保持する
2. WHEN `makefile-improvements`が`improvements/`に移動された時 THEN システムは開発改善specとして分類する
3. WHEN `backend-test-data-management`が`improvements/`に移動された時 THEN システムは開発改善specとして分類する
4. WHEN `react-native-buffer-polyfill`が`bugfix/`に移動された時 THEN システムはバグ修正specとして分類する
5. WHEN 既存specが再配置された時 THEN 各specの内容は変更されずに保持される

### 要件 4

**ユーザーストーリー:** 開発者として、spec運用ルールを明文化したいので、チーム全体で一貫した運用ができる

#### 受入基準

1. WHEN `.kiro/steering/spec-management.md`が作成された時 THEN システムはspec運用ルールを提供する
2. WHEN steering設定が有効な時 THEN Kiroは自動的に`core/`配下の仕様を参照する
3. WHEN 運用ルールが記載された時 THEN 新機能追加からcore統合までのフローが明確になる
4. WHEN 運用ルールが記載された時 THEN spec作成時の命名規則とディレクトリ配置ルールが明確になる
5. WHEN 運用ルールが記載された時 THEN 完了したspecのarchive移動タイミングが明確になる

### 要件 5

**ユーザーストーリー:** 開発者として、`core/`の初期内容を`mahjong-score-management`から作成したいので、既存の完成した仕様を基準として統合版を開始できる

#### 受入基準

1. WHEN `core/requirements.md`が作成された時 THEN `mahjong-score-management/requirements.md`の内容をベースとする
2. WHEN `core/design.md`が作成された時 THEN `mahjong-score-management/design.md`の内容をベースとする
3. WHEN `core/architecture.md`が作成された時 THEN システム全体のアーキテクチャ概要を記載する
4. WHEN core配下のファイルが作成された時 THEN 今後の機能追加で更新される「生きたドキュメント」として機能する
5. WHEN core配下のファイルが作成された時 THEN 元の`mahjong-score-management`は参照用としてarchiveに保持される

### 要件 6

**ユーザーストーリー:** 開発者として、各カテゴリディレクトリにREADMEを配置したいので、各カテゴリの目的と使い方が明確になる

#### 受入基準

1. WHEN `core/README.md`が作成された時 THEN 統合仕様の役割と更新方針が記載される
2. WHEN `features/README.md`が作成された時 THEN 新機能追加specの作成方法とcore統合フローが記載される
3. WHEN `improvements/README.md`が作成された時 THEN 開発改善specの作成方法が記載される
4. WHEN `bugfix/README.md`が作成された時 THEN バグ修正specの作成方法が記載される
5. WHEN `archive/README.md`が作成された時 THEN archive配下のspecの参照方法が記載される

### 要件 7

**ユーザーストーリー:** 開発者として、ディレクトリ構造の全体像を可視化したいので、spec管理体系を一目で理解できる

#### 受入基準

1. WHEN `.kiro/specs/README.md`が作成または更新された時 THEN 新しいディレクトリ構造が図示される
2. WHEN README.mdが更新された時 THEN 各カテゴリの役割が説明される
3. WHEN README.mdが更新された時 THEN spec作成から完了までのライフサイクルが説明される
4. WHEN README.mdが更新された時 THEN Kiroへの指示方法の例が記載される
5. WHEN README.mdが更新された時 THEN steering経由での自動参照設定が説明される
