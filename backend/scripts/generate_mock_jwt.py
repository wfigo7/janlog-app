#!/usr/bin/env python3
"""
local環境用の静的JWT生成スクリプト
"""
import json
from jose import jwt
from datetime import datetime, timezone

# local環境用のJWT設定（複数ユーザー対応）
MOCK_JWT_PAYLOADS = {
    "user": {
        "sub": "test-user-001",
        "email": "test@example.com",
        "cognito:username": "test-user-001",
        "custom:role": "user",
        "iss": "mock-issuer",
        "aud": "janlog-local",
        "exp": 9999999999,  # 期限切れしない値
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "token_use": "id"
    },
    "admin": {
        "sub": "test-admin-001",
        "email": "admin@example.com",
        "cognito:username": "test-admin-001",
        "custom:role": "admin",
        "iss": "mock-issuer",
        "aud": "janlog-local",
        "exp": 9999999999,  # 期限切れしない値
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "token_use": "id"
    }
}

# 署名用の秘密鍵（local環境専用）
MOCK_SECRET = "local-development-secret-key-do-not-use-in-production"

def generate_mock_jwt(user_type: str = "user"):
    """静的JWTを生成する"""
    payload = MOCK_JWT_PAYLOADS.get(user_type)
    if not payload:
        raise ValueError(f"Invalid user type: {user_type}. Use 'user' or 'admin'")
    
    token = jwt.encode(payload, MOCK_SECRET, algorithm="HS256")
    return token, payload

def main():
    """メイン関数"""
    print("=== Local環境用 静的JWT生成 ===\n")
    
    # 通常ユーザー
    user_token, user_payload = generate_mock_jwt("user")
    print("【通常ユーザー】")
    print(f"JWT Token: {user_token}")
    print(f"Payload: {json.dumps(user_payload, indent=2)}")
    print()
    
    # 管理者ユーザー
    admin_token, admin_payload = generate_mock_jwt("admin")
    print("【管理者ユーザー】")
    print(f"JWT Token: {admin_token}")
    print(f"Payload: {json.dumps(admin_payload, indent=2)}")
    print()
    
    print("=== .env.localに追加する設定 ===")
    print(f"# 通常ユーザー用")
    print(f"EXPO_PUBLIC_MOCK_JWT={user_token}")
    print()
    print(f"# 管理者ユーザー用（テスト時に切り替え）")
    print(f"# EXPO_PUBLIC_MOCK_JWT={admin_token}")
    print()
    print("JWT_ISSUER=mock-issuer")
    print("JWT_AUDIENCE=janlog-local")

if __name__ == "__main__":
    main()