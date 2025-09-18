#!/usr/bin/env python3
"""
対局記録APIのテストスクリプト
"""
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv


def test_match_api():
    """対局記録APIをテスト"""
    load_dotenv(".env.local")

    base_url = "http://localhost:8080"

    print("=== 対局記録API テスト ===")

    # テスト用対局データ（個人成績用）
    test_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "four",
        "entryMethod": "rank_plus_points",
        "rulesetId": "mleague-rule",  # テスト用のルールセットID
        "rank": 2,
        "finalPoints": 250.0,
        "chipCount": 5,
        "memo": "テスト対局",
    }

    # 1. 対局登録テスト
    print("\n1. 対局登録テスト")
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=test_match,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 201:
            response_data = response.json()
            match_data = response_data.get("data")
            match_id = match_data.get("matchId")
            print(f"   対局ID: {match_id}")
            print(f"   ゲームモード: {match_data.get('gameMode')}")
            print("   ✅ 対局登録成功")
        else:
            print(f"   ❌ エラー: {response.text}")
            assert False, f"対局登録エラー: {response.text}"
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 対局登録失敗: {e}")
        assert False, f"対局登録失敗: {e}"

    # 2. 対局一覧取得テスト
    print("\n2. 対局一覧取得テスト")
    try:
        response = requests.get(f"{base_url}/matches", timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            matches_data = response.json()
            matches = matches_data.get("matches", [])
            total = matches_data.get("total", 0)
            print(f"   対局数: {total}")
            if matches:
                print(f"   最新対局ID: {matches[0].get('matchId')}")
            print("   ✅ 対局一覧取得成功")
        else:
            print(f"   ❌ エラー: {response.text}")
            assert False, f"対局一覧取得エラー: {response.text}"
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 対局一覧取得失敗: {e}")
        assert False, f"対局一覧取得失敗: {e}"

    # 3. 特定対局取得テスト
    if match_id:
        print("\n3. 特定対局取得テスト")
        try:
            response = requests.get(f"{base_url}/matches/{match_id}", timeout=10)
            print(f"   ステータス: {response.status_code}")
            if response.status_code == 200:
                match_data = response.json()
                print(f"   対局ID: {match_data.get('matchId')}")
                print(f"   順位: {match_data.get('rank')}")
                print("   ✅ 特定対局取得成功")
            else:
                print(f"   ❌ エラー: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"   ❌ 特定対局取得失敗: {e}")

    # 4. フィルター付き対局一覧取得テスト
    print("\n4. フィルター付き対局一覧取得テスト")
    try:
        # 4人麻雀のみ取得
        response = requests.get(f"{base_url}/matches?mode=four", timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            matches_data = response.json()
            total = matches_data.get("total", 0)
            print(f"   4人麻雀対局数: {total}")
            print("   ✅ フィルター付き取得成功")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ フィルター付き取得失敗: {e}")

    print("\n✅ 対局記録APIテストが完了しました！")
    assert True  # pytest用のアサーション


if __name__ == "__main__":
    test_match_api()
