#!/usr/bin/env python3
"""
環境別FastAPIサーバー起動スクリプト
"""
import os
import sys
import uvicorn
from dotenv import load_dotenv

def load_environment_config(env: str = "local"):
    """環境別の設定を読み込み"""
    env_file = f'.env.{env}'
    
    if not os.path.exists(env_file):
        print(f"❌ 環境設定ファイル '{env_file}' が見つかりません")
        sys.exit(1)
    
    load_dotenv(env_file)
    print(f"✅ 環境設定ファイル '{env_file}' を読み込みました")

def main():
    """環境別開発サーバーを起動"""
    # 環境を取得（デフォルトはlocal）
    environment = os.getenv('JANLOG_ENV', 'local')
    
    # 環境設定を読み込み
    load_environment_config(environment)
    
    # 環境変数の確認
    print("=== Janlog Backend サーバー ===")
    print(f"環境: {os.getenv('ENVIRONMENT', environment)}")
    print(f"DynamoDB Endpoint: {os.getenv('DYNAMODB_ENDPOINT_URL', 'AWS DynamoDB')}")
    print(f"テーブル名: {os.getenv('DYNAMODB_TABLE_NAME', 'janlog-table')}")
    
    # local環境の場合は認証情報も表示
    if environment == 'local':
        print(f"JWT Issuer: {os.getenv('JWT_ISSUER', 'N/A')}")
        print(f"JWT Audience: {os.getenv('JWT_AUDIENCE', 'N/A')}")
        print("認証: 静的JWT認証")
    else:
        print(f"Cognito User Pool: {os.getenv('COGNITO_USER_POOL_ID', 'N/A')}")
        print(f"Cognito Client: {os.getenv('COGNITO_CLIENT_ID', 'N/A')}")
        print("認証: Cognito JWT認証")
    
    print()
    print(f"🚀 サーバーを起動中... (環境: {environment})")
    print("📖 API ドキュメント: http://localhost:8080/docs")
    print("🏥 ヘルスチェック: http://localhost:8080/health")
    print()
    
    # FastAPIサーバーを起動
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info" if environment == "production" else "debug"
    )

if __name__ == "__main__":
    main()