#!/usr/bin/env python3
"""
local環境用の静的JWT生成スクリプト
"""
import json
from jose import jwt
from datetime import datetime, timezone

# local環境用のJWT設定
MOCK_JWT_PAYLOAD = {
    "sub": "test-user-001",
    "email": "test@example.com",
    "cognito:username": "test-user-001",
    "custom:role": "user",
    "iss": "mock-issuer",
    "aud": "janlog-local",
    "exp": 9999999999,  # 期限切れしない値
    "iat": int(datetime.now(timezone.utc).timestamp()),
    "token_use": "id"
}

# 署名用の秘密鍵（local環境専用）
MOCK_SECRET = "local-development-secret-key-do-not-use-in-production"

def generate_mock_jwt():
    """静的JWTを生成する"""
    token = jwt.encode(MOCK_JWT_PAYLOAD, MOCK_SECRET, algorithm="HS256")
    return token

def main():
    """メイン関数"""
    token = generate_mock_jwt()
    
    print("=== Local環境用 静的JWT ===")
    print(f"JWT Token: {token}")
    print()
    print("=== .env.localに追加する設定 ===")
    print(f"MOCK_JWT={token}")
    print("JWT_ISSUER=mock-issuer")
    print("JWT_AUDIENCE=janlog-local")
    print()
    print("=== JWT Payload ===")
    print(json.dumps(MOCK_JWT_PAYLOAD, indent=2))

if __name__ == "__main__":
    main()