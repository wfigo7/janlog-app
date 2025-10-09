"""
データベース初期化・管理スクリプト

このパッケージには、DynamoDBのテーブル作成とseedデータ投入のための
スクリプトが含まれています。

主要スクリプト:
- create_tables.py: テーブル作成・削除
- seed_users.py: ユーザーデータ投入
- seed_rulesets.py: ルールセットデータ投入
- init_db.py: 統合初期化（上記を順次実行）
- utils.py: 共通ユーティリティ関数
"""
