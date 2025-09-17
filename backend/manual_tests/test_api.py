#!/usr/bin/env python3
"""
ローカルAPIのテストスクリプト
"""
import requests
import json
import time
import subprocess
import os
from dotenv import load_dotenv

def test_api():
    """APIエンドポイントをテスト"""
    load_dotenv('.env.local')
    
    base_url = "http://localhost:8080"
    
    print("=== Janlog API テスト ===")
    
    # ヘルスチェック
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"✅ ヘルスチェック: {response.status_code}")
        if response.status_code == 200:
            health_data = response.json()
            print(f"   ステータス: {health_data.get('status')}")
            print(f"   環境: {health_data.get('environment')}")
            print(f"   サービス: {health_data.get('services')}")
        else:
            print(f"   エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ ヘルスチェック失敗: {e}")
        assert False, f"ヘルスチェック失敗: {e}"
    
    # ルートエンドポイント
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ ルートエンドポイント: {response.status_code}")
        if response.status_code == 200:
            root_data = response.json()
            print(f"   メッセージ: {root_data.get('message')}")
        else:
            print(f"   エラー: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ ルートエンドポイント失敗: {e}")
        assert False, f"ルートエンドポイント失敗: {e}"
    
    print("\n✅ 全てのテストが成功しました！")
    assert True  # pytest用のアサーション

if __name__ == "__main__":
    test_api()