# Implementation Plan

- [x] 1. 基本設定の強化とシェル安全性向上
  - Makefileにシェル設定を追加（SHELL, .SHELLFLAGS, .ONESHELL）
  - Python実行可能ファイルの自動検出変数を追加
  - 環境変数ファイルの自動読み込み設定を追加
  - 変更内容をDEVELOPMENT.mdに記録
  - _Requirements: 3.1, 3.2, 3.3, 8.2_

- [x] 2. ターゲット定義の一貫性確保
  - .PHONYディレクティブにdb-cleanを追加
  - helpに表示されるコマンド名と実際のターゲット名の不一致を修正
  - 未定義のcleanターゲットを実装または.PHONYから削除
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Docker Compose V2対応
  - 全てのdocker-composeコマンドをdocker composeに変更
  - start-runner.shとtest-runner.sh内のdocker-compose呼び出しも更新
  - _Requirements: 2.1, 2.2_

- [x] 4. Python仮想環境処理の改良
  - db-create-tablesターゲットで仮想環境の存在確認とアクティベート処理を追加
  - Python実行時にPY変数を使用するよう修正
  - 仮想環境が存在しない場合の適切なエラーメッセージを追加
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. 破壊的操作の安全性強化
  - db-cleanターゲットでdocker system pruneを制限し、プロジェクト固有のリソースのみ削除
  - --remove-orphansオプションを追加してより安全なクリーンアップを実装
  - 破壊的操作の警告メッセージを改善
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. ヘルスチェックの信頼性向上
  - checkターゲットのcurlコマンドに-f -S -sオプションを追加
  - HTTPステータスコードを適切に検証するよう修正
  - フロントエンドのヘルスチェックで適切な警告メッセージを表示
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. cleanターゲットの実装
  - 生成されたファイルやキャッシュを安全に削除するcleanターゲットを実装
  - backend/.pytest_cache, backend/.coverage, frontend/.expo等を削除
  - エラーが発生しても処理を継続するよう|| trueを追加
  - _Requirements: 8.1_

- [x] 8. 表記ゆれ解消用エイリアスの追加

  - db-start: start-dbのエイリアスを実装
  - db-stop: stopのエイリアスを実装
  - helpの表記とターゲット名の完全一致を確保
  - _Requirements: 1.1, 8.3_

- [x] 9. 自動化されたヘルプ生成システムの実装
  - コメントベースのヘルプ生成機能を実装
  - 各ターゲットに## コメント形式で説明を追加
  - awkを使用した自動ヘルプ生成スクリプトを実装
  - 新しいヘルプシステムの使用方法をDEVELOPMENT.mdに追加
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. エラーハンドリングの改善
  - 具体的なエラーメッセージと解決方法の案内を追加
  - 前提条件が満たされていない場合の適切な案内を実装
  - 色分けによる視覚的なエラー表示を維持・改善
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 11. 全体テストと動作確認
  - 改良されたMakefileで全ターゲットの動作確認
  - 短縮コマンド（tf, tb, ti, sd, sb, sf）の動作確認
  - エラーケースでの適切な処理確認
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 12. ドキュメント修正　※基本的に修正後のMakefileを正とする
  - DEVELOPMENT.mdへの反映。下部の修正履歴も不要なので正しい状態にマージ
  - README.mdへの反映。ルートとサブプロジェクトの両方
  - steering/scripts.mdへの反映

- [x] 13. サブディレクトリからのmake実行対応
  - プロジェクトルートに.rootマーカーファイルを作成
  - プロジェクトルート検出機能を実装（.rootファイルベース）
  - frontend/Makefileを作成して動的委譲の仕組みを実装
  - backend/Makefileを作成して動的委譲の仕組みを実装
  - infra/Makefileを作成して動的委譲の仕組みを実装
  - 各サブディレクトリからの動作確認とテスト
  - _Requirements: 11.1, 11.2, 11.3, 11.4_
