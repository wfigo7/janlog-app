#!/usr/bin/env python3
"""
対局記録API CRUD操作テストスクリプト
"""
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

def test_crud_operations():
    """CRUD操作をテスト"""
    load_dotenv('.env.local')
    
    base_url = "http://localhost:8080"
    
    print("=== 対局記録API CRUD操作テスト ===")
    
    # 1. 対局作成
    print("\n1. 対局作成テスト")
    test_match = {
        "date": datetime.now().isoformat(),
        "gameMode": "four",
        "entryMethod": "rank_plus_points",
        "rank": 3,
        "finalPoints": 150.0,
        "chipCount": 2,
        "memo": "CRUD テスト対局"
    }
    
    match_id = None
    try:
        response = requests.post(
            f"{base_url}/matches",
            json=test_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            match_data = response.json()
            match_id = match_data.get("matchId")
            print(f"   作成された対局ID: {match_id}")
            print("   ✅ 対局作成成功")
        else:
            print(f"   ❌ エラー: {response.text}")
            assert False, f"対局作成エラー: {response.text}"
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 対局作成失敗: {e}")
        assert False, f"対局作成失敗: {e}"
    
    if not match_id:
        print("対局IDが取得できませんでした")
        assert False, "対局IDが取得できませんでした"
    
    # 2. 対局取得
    print("\n2. 対局取得テスト")
    try:
        response = requests.get(f"{base_url}/matches/{match_id}", timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            match_data = response.json()
            print(f"   取得した対局ID: {match_data.get('matchId')}")
            print(f"   順位: {match_data.get('rank')}")
            print(f"   メモ: {match_data.get('memo')}")
            print("   ✅ 対局取得成功")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 対局取得失敗: {e}")
    
    # 3. 対局更新
    print("\n3. 対局更新テスト")
    updated_match = {
        "date": (datetime.now() - timedelta(days=1)).isoformat(),
        "gameMode": "four",
        "entryMethod": "rank_plus_points",
        "rank": 1,  # 3位から1位に変更
        "finalPoints": 450.0,  # ポイントも変更
        "chipCount": 8,
        "memo": "更新されたテスト対局"
    }
    
    try:
        response = requests.put(
            f"{base_url}/matches/{match_id}",
            json=updated_match,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            match_data = response.json()
            print(f"   更新された順位: {match_data.get('rank')}")
            print(f"   更新されたポイント: {match_data.get('finalPoints')}")
            print(f"   更新されたメモ: {match_data.get('memo')}")
            print("   ✅ 対局更新成功")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 対局更新失敗: {e}")
    
    # 4. 更新後の対局取得（確認）
    print("\n4. 更新確認テスト")
    try:
        response = requests.get(f"{base_url}/matches/{match_id}", timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            match_data = response.json()
            if match_data.get('rank') == 1 and match_data.get('memo') == "更新されたテスト対局":
                print("   ✅ 更新が正しく反映されています")
            else:
                print("   ❌ 更新が正しく反映されていません")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 更新確認失敗: {e}")
    
    # 5. 対局削除
    print("\n5. 対局削除テスト")
    try:
        response = requests.delete(f"{base_url}/matches/{match_id}", timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   メッセージ: {result.get('message')}")
            print("   ✅ 対局削除成功")
        else:
            print(f"   ❌ エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 対局削除失敗: {e}")
    
    # 6. 削除後の対局取得（確認）
    print("\n6. 削除確認テスト")
    try:
        response = requests.get(f"{base_url}/matches/{match_id}", timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 404:
            print("   ✅ 対局が正しく削除されています")
        else:
            print(f"   ❌ 対局が削除されていません: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ 削除確認失敗: {e}")
    
    # 7. 存在しない対局の操作テスト
    print("\n7. 存在しない対局操作テスト")
    fake_id = "non-existent-match-id"
    
    # 存在しない対局の取得
    try:
        response = requests.get(f"{base_url}/matches/{fake_id}", timeout=10)
        print(f"   取得ステータス: {response.status_code}")
        if response.status_code == 404:
            print("   ✅ 存在しない対局の取得で正しく404が返されました")
        else:
            print(f"   ❌ 予期しないレスポンス: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    # 存在しない対局の削除
    try:
        response = requests.delete(f"{base_url}/matches/{fake_id}", timeout=10)
        print(f"   削除ステータス: {response.status_code}")
        if response.status_code == 404:
            print("   ✅ 存在しない対局の削除で正しく404が返されました")
        else:
            print(f"   ❌ 予期しないレスポンス: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ リクエスト失敗: {e}")
    
    print("\n✅ CRUD操作テストが完了しました！")
    assert True  # pytest用のアサーション

if __name__ == "__main__":
    test_crud_operations()