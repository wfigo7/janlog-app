#!/usr/bin/env python3
"""
デフォルトのグローバルルールセットを作成するスクリプト
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv(".env.local")

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ruleset_service import get_ruleset_service


async def create_default_rulesets():
    """デフォルトのグローバルルールセットを作成"""
    try:
        print("デフォルトのグローバルルールセットを作成中...")
        
        ruleset_service = get_ruleset_service()
        rulesets = await ruleset_service.create_default_global_rulesets()
        
        print(f"✅ {len(rulesets)}個のデフォルトルールセットを作成しました:")
        
        for ruleset in rulesets:
            print(f"  - {ruleset.ruleName} ({ruleset.gameMode}麻雀)")
            print(f"    開始点: {ruleset.startingPoints}, 基準点: {ruleset.basePoints}")
            print(f"    ウマ: {ruleset.uma}, オカ: {ruleset.oka}")
            print()
        
        print("✅ デフォルトルールセットの作成が完了しました")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_default_rulesets())