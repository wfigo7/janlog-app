#!/usr/bin/env python3
"""
既存ルールセットにuseChipsフィールドを追加するマイグレーションスクリプト
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv(".env.local")

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.dynamodb_utils import get_dynamodb_client
from app.config.settings import settings


async def migrate_rulesets():
    """既存ルールセットにuseChipsフィールドを追加"""
    try:
        print("既存ルールセットのマイグレーションを開始...")
        
        dynamodb_client = get_dynamodb_client()
        table_name = settings.DYNAMODB_TABLE_NAME
        
        # DynamoDB接続確認
        print("DynamoDB接続を確認中...")
        if not await dynamodb_client.health_check():
            print("❌ DynamoDBに接続できません。DynamoDB Localが起動しているか確認してください。")
            print("DynamoDB Localを起動するには: docker run -p 8000:8000 amazon/dynamodb-local")
            sys.exit(1)
        
        # 全てのルールセットを取得
        print("ルールセットを検索中...")
        
        # グローバルルールセットを取得
        global_rulesets = await dynamodb_client.query_items(
            table_name=table_name,
            key_condition_expression="PK = :pk AND begins_with(SK, :sk_prefix)",
            expression_attribute_values={
                ":pk": "GLOBAL",
                ":sk_prefix": "RULESET#"
            }
        )
        
        # 全ユーザーのルールセットを取得（スキャンを使用）
        user_rulesets = await dynamodb_client.scan_items(
            table_name=table_name,
            filter_expression="begins_with(PK, :pk_prefix) AND begins_with(SK, :sk_prefix) AND entityType = :entity_type",
            expression_attribute_values={
                ":pk_prefix": "USER#",
                ":sk_prefix": "RULESET#",
                ":entity_type": "RULESET"
            }
        )
        
        all_rulesets = global_rulesets + user_rulesets
        
        print(f"見つかったルールセット: {len(all_rulesets)}個")
        
        if len(all_rulesets) == 0:
            print("⚠️  ルールセットが見つかりませんでした。先にデフォルトルールセットを作成してください。")
            print("デフォルトルールセット作成: python scripts/create_default_rulesets.py")
            return
        
        updated_count = 0
        
        for ruleset in all_rulesets:
            # useChipsフィールドが存在しない場合のみ更新
            if 'useChips' not in ruleset:
                print(f"更新中: {ruleset.get('ruleName', 'Unknown')} (ID: {ruleset.get('rulesetId', 'Unknown')})")
                
                # useChipsフィールドを追加（デフォルトはfalse）
                ruleset['useChips'] = False
                
                # DynamoDBに更新
                await dynamodb_client.put_item(table_name, ruleset)
                updated_count += 1
            else:
                print(f"スキップ: {ruleset.get('ruleName', 'Unknown')} (既にuseChipsフィールドが存在)")
        
        if updated_count > 0:
            print(f"✅ マイグレーション完了: {updated_count}個のルールセットを更新しました")
        else:
            print("✅ 全てのルールセットは既に最新です")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    print("マイグレーションスクリプトを開始します...")
    try:
        asyncio.run(migrate_rulesets())
    except KeyboardInterrupt:
        print("\n❌ マイグレーションが中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 予期しないエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)