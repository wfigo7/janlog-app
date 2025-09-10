#!/usr/bin/env python3
"""
ローカル開発環境用のFastAPIサーバー起動スクリプト
"""
import os
import uvicorn
from dotenv import load_dotenv

def main():
    """ローカル開発サーバーを起動"""
    # .env.localファイルを読み込み
    load_dotenv('.env.local')
    
    # 環境変数の確認
    print("=== Janlog Backend ローカル開発サーバー ===")
    print(f"環境: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"DynamoDB Endpoint: {os.getenv('DYNAMODB_ENDPOINT_URL', 'http://localhost:8000')}")
    print(f"テーブル名: {os.getenv('DYNAMODB_TABLE_NAME', 'janlog-table')}")
    print()
    
    # FastAPIサーバーを起動
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="debug"
    )

if __name__ == "__main__":
    main()