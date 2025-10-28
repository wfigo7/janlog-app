#!/usr/bin/env python3
"""
対局記録APIのバリデーションテストスクリプト
"""
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

def test_validation():
    """バリデーションをテスト"""
    load_dotenv('.env.local')
    
    base_url = "http://localhost:8080"
    
    print("=== 対局記録API バリデーションテスト ===")
    
    # 1. 必須フィールド不足テスト
    print("\n1. 必須フィールド不足テスト")
    invalid_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "four",
        # entryMethodとrankが不足
    }
    
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=invalid_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 422:
            print("   ✅ バリデーションエラーが正しく検出されました")
        else:
            print(f"   ❌ 予期しないレスポンス: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    # 2. 無効な順位テスト（3人麻雀で4位）
    print("\n2. 無効な順位テスト（3人麻雀で4位）")
    invalid_rank_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "three",
        "entryMethod": "rank_plus_points",
        "rank": 4,  # 3人麻雀で4位は無効
        "finalPoints": 25000
    }
    
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=invalid_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 422:
            print("   ✅ 順位バリデーションが正しく動作しました")
        else:
            print(f"   ❌ 予期しないレスポンス: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    # 3. 入力方式と必須フィールドの整合性テスト
    print("\n3. 入力方式バリデーションテスト（rank_plus_pointsでfinalPoints不足）")
    missing_points_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "four",
        "entryMethod": "rank_plus_points",
        "rank": 2,
        # finalPointsが不足
    }
    
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=missing_points_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 422:
            print("   ✅ 入力方式バリデーションが正しく動作しました")
        else:
            print(f"   ❌ 予期しないレスポンス: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    # 4. 正常なデータでの登録テスト（3人麻雀）
    print("\n4. 正常データテスト（3人麻雀）")
    valid_three_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "three",
        "entryMethod": "rank_plus_raw",
        "rank": 1,
        "rawScore": 35000,
        "chipCount": 10,
        "memo": "3人麻雀テスト"
    }
    
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=valid_three_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            match_data = response.json()
            print(f"   対局ID: {match_data.get('matchId')}")
            print(f"   ゲームモード: {match_data.get('gameMode')}")
            print("   ✅ 3人麻雀対局登録成功")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    # 5. 仮ポイント方式テスト
    print("\n5. 仮ポイント方式テスト")
    provisional_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "four",
        "entryMethod": "provisional_rank_only",
        "rank": 3,
        "memo": "仮ポイントテスト"
    }
    
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=provisional_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            match_data = response.json()
            print(f"   対局ID: {match_data.get('matchId')}")
            print(f"   入力方式: {match_data.get('entryMethod')}")
            print("   ✅ 仮ポイント方式対局登録成功")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    print("\n✅ バリデーションテストが完了しました！")

if __name__ == "__main__":
    test_validation()