"""
認証サービス
Cognito JWT トークンの検証とユーザー情報の取得を行う
"""
import json
import requests
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config.settings import settings


class AuthService:
    def __init__(self):
        self.region = settings.AWS_REGION
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.client_id = settings.COGNITO_CLIENT_ID
        self.jwks_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
        self._jwks_cache: Optional[Dict[str, Any]] = None

    def _get_jwks(self) -> Dict[str, Any]:
        """
        JWKSを取得する（キャッシュ機能付き）
        """
        if self._jwks_cache is None:
            try:
                response = requests.get(self.jwks_url, timeout=10)
                response.raise_for_status()
                self._jwks_cache = response.json()
            except requests.RequestException as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"JWKSの取得に失敗しました: {str(e)}"
                )
        return self._jwks_cache

    def _get_signing_key(self, token: str) -> str:
        """
        JWTトークンから署名キーを取得する
        """
        try:
            # トークンのヘッダーを取得
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="トークンにkidが含まれていません"
                )

            # JWKSから対応するキーを検索
            jwks = self._get_jwks()
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    return key
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="対応する署名キーが見つかりません"
            )
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"トークンの解析に失敗しました: {str(e)}"
            )

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        JWTトークンを検証してペイロードを返す
        """
        try:
            # 署名キーを取得
            signing_key = self._get_signing_key(token)
            
            # トークンを検証
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=['RS256'],
                audience=self.client_id,
                issuer=f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}"
            )
            
            return payload
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"トークンの検証に失敗しました: {str(e)}"
            )

    def get_user_from_token(self, token: str) -> Dict[str, Any]:
        """
        JWTトークンからユーザー情報を取得する
        """
        payload = self.verify_token(token)
        
        # Cognitoのペイロードからユーザー情報を抽出
        user_info = {
            'user_id': payload.get('sub'),
            'email': payload.get('email'),
            'email_verified': payload.get('email_verified', False),
            'cognito_username': payload.get('cognito:username'),
            'token_use': payload.get('token_use'),
            'auth_time': payload.get('auth_time'),
            'exp': payload.get('exp'),
            'iat': payload.get('iat'),
        }
        
        # カスタム属性があれば追加
        for key, value in payload.items():
            if key.startswith('custom:'):
                user_info[key] = value
        
        return user_info

    def get_user_role(self, token: str) -> str:
        """
        ユーザーの役割を取得する
        """
        payload = self.verify_token(token)
        
        # カスタム属性からroleを取得（デフォルトはuser）
        role = payload.get('custom:role', 'user')
        return role

    def require_admin_role(self, token: str) -> None:
        """
        管理者権限を要求する
        """
        role = self.get_user_role(token)
        if role != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="管理者権限が必要です"
            )


# シングルトンインスタンス
_auth_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """
    AuthServiceのシングルトンインスタンスを取得する
    """
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service