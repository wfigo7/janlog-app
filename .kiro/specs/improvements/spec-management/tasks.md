# 実装計画

- [x] 1. カテゴリ別ディレクトリ構造の作成
  - `.kiro/specs/`配下に新しいディレクトリ構造を作成
  - 各カテゴリディレクトリ（core、features、improvements、bugfix、archive）を作成
  - _要件: 1.1, 2.1, 2.2, 2.3, 2.4_

- [x] 2. core/ディレクトリの初期化
  - core/ディレクトリとREADME.mdを作成
  - mahjong-score-managementの内容を基にcore/requirements.mdを作成
  - mahjong-score-managementの内容を基にcore/design.mdを作成
  - システム全体のアーキテクチャを記載したcore/architecture.mdを作成
  - _要件: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4_

- [x] 3. カテゴリ別READMEファイルの作成
  - core/README.mdを作成（統合仕様の役割と更新方針を記載）
  - features/README.mdを作成（新機能追加specの作成方法とcore統合フローを記載）
  - improvements/README.mdを作成（開発改善specの作成方法を記載）
  - bugfix/README.mdを作成（バグ修正specの作成方法を記載）
  - archive/README.mdを作成（archive配下のspecの参照方法を記載）
  - _要件: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. 既存specの再配置
  - mahjong-score-managementをarchive/に移動
  - makefile-improvementsをimprovements/に移動
  - backend-test-data-managementをimprovements/に移動
  - react-native-buffer-polyfilをbugfix/に移動
  - spec-management（本spec）をimprovements/に配置（既に正しい位置）
  - _要件: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. steering設定ファイルの作成
  - .kiro/steering/spec-management.mdを作成
  - spec運用ルール（ディレクトリ構造、運用フロー、命名規則）を記載
  - Kiroへの指示方法の例を記載
  - core/配下のファイルへの自動参照設定を追加
  - _要件: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. specs/README.mdの更新
  - kiro/specs/README.mdを作成
  - 各サブディレクトリのREADME.mdの内容を統合
  - 新しいディレクトリ構造を図示
  - 各カテゴリの役割を説明
  - spec作成から完了までのライフサイクルを説明
  - Kiroへの指示方法の例を記載
  - steering経由での自動参照設定を説明
  - _要件: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. 動作確認とドキュメント検証
  - 全ディレクトリとファイルが正しく作成されているか確認
  - 既存specが適切なカテゴリに配置されているか確認
  - core/の初期内容がmahjong-score-managementの内容を反映しているか確認
  - steering設定が正しく記載されているか確認
  - 各READMEファイルの内容が適切か確認
  - _要件: 全要件の統合確認_
