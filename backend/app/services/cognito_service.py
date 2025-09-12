"""
Cognito管理サービス
ユーザーの招待、管理機能を提供する
"""
import boto3
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
from app.config.settings import settings
# InviteUserRequestは不要（Cognitoコンソールから直接招待）


class CognitoService:
    def __init__(self):
        self.client = boto3.client('cognito-idp', region_name=settings.AWS_REGION)
        self.user_pool_id = settings.COGNITO_USER_POOL_ID

    # 招待機能はCognitoコンソールから直接実行するため削除

    async def get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザー情報を取得する
        """
        if not self.user_pool_id:
            return None

        try:
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )

            # 属性を辞書に変換
            attributes = {}
            for attr in response.get('UserAttributes', []):
                attributes[attr['Name']] = attr['Value']

            return {
                'user_id': response['Username'],
                'email': attributes.get('email'),
                'email_verified': attributes.get('email_verified') == 'true',
                'display_name': attributes.get('custom:display_name'),
                'role': attributes.get('custom:role', 'user'),
                'invited_by': attributes.get('custom:invited_by'),
                'user_status': response.get('UserStatus'),
                'created_date': response.get('UserCreateDate'),
                'last_modified_date': response.get('UserLastModifiedDate'),
            }

        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return None
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ユーザー情報の取得に失敗しました: {e.response['Error']['Message']}"
            )

    async def update_user_attributes(self, user_id: str, attributes: Dict[str, str]) -> bool:
        """
        ユーザー属性を更新する
        """
        if not self.user_pool_id:
            return False

        try:
            user_attributes = []
            for name, value in attributes.items():
                user_attributes.append({
                    'Name': name,
                    'Value': value
                })

            self.client.admin_update_user_attributes(
                UserPoolId=self.user_pool_id,
                Username=user_id,
                UserAttributes=user_attributes
            )

            return True

        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ユーザー属性の更新に失敗しました: {e.response['Error']['Message']}"
            )


# シングルトンインスタンス
_cognito_service: Optional[CognitoService] = None


def get_cognito_service() -> CognitoService:
    """
    CognitoServiceのシングルトンインスタンスを取得する
    """
    global _cognito_service
    if _cognito_service is None:
        _cognito_service = CognitoService()
    return _cognito_service