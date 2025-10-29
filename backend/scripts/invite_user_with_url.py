#!/usr/bin/env python3
"""
Cognitoユーザー招待スクリプト（カスタムメッセージ付き）

Usage:
    python scripts/invite_user_with_url.py user@example.com --app-url "https://expo.dev/..." --role user
"""

import argparse
import boto3
import os
from typing import Optional


def invite_user(
    email: str,
    role: str = 'user',
    app_url: Optional[str] = None,
    user_pool_id: Optional[str] = None
):
    """
    Cognitoユーザーを招待
    
    Args:
        email: ユーザーのメールアドレス
        role: ユーザーロール（user or admin）
        app_url: アプリのインストールURL（オプション）
        user_pool_id: Cognito User Pool ID（環境変数から取得可能）
    """
    if not user_pool_id:
        user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
        if not user_pool_id:
            raise ValueError("COGNITO_USER_POOL_ID environment variable is required")
    
    client = boto3.client('cognito-idp', region_name='ap-northeast-1')
    
    # ユーザー作成（メール送信あり）
    response = client.admin_create_user(
        UserPoolId=user_pool_id,
        Username=email,
        UserAttributes=[
            {'Name': 'email', 'Value': email},
            {'Name': 'email_verified', 'Value': 'true'},
            {'Name': 'custom:role', 'Value': role}
        ],
        DesiredDeliveryMediums=['EMAIL']
    )
    
    print(f"✓ User {email} invited successfully!")
    print(f"  Role: {role}")
    
    # カスタムURLがある場合は追加メールを送信（オプション）
    if app_url:
        print(f"\n追加情報:")
        print(f"  アプリURL: {app_url}")
        print(f"\n※ 必要に応じて、このURLを別途ユーザーに送信してください。")
    
    return response


def main():
    parser = argparse.ArgumentParser(
        description='Cognitoユーザーを招待'
    )
    parser.add_argument(
        'email',
        help='招待するユーザーのメールアドレス'
    )
    parser.add_argument(
        '--role',
        default='user',
        choices=['user', 'admin'],
        help='ユーザーロール（デフォルト: user）'
    )
    parser.add_argument(
        '--app-url',
        help='アプリのインストールURL（QRコードのURL等）'
    )
    parser.add_argument(
        '--user-pool-id',
        help='Cognito User Pool ID（環境変数COGNITO_USER_POOL_IDでも指定可能）'
    )
    
    args = parser.parse_args()
    
    try:
        invite_user(
            email=args.email,
            role=args.role,
            app_url=args.app_url,
            user_pool_id=args.user_pool_id
        )
    except Exception as e:
        print(f"✗ Error: {e}")
        exit(1)


if __name__ == '__main__':
    main()
