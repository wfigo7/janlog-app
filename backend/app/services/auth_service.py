"""
認証サービス
Cognito JWT トークンの検証とユーザー情報の取得を行う
"""

import json
import logging
import requests
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config.settings import settings

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.region = settings.AWS_REGION
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.client_id = settings.COGNITO_CLIENT_ID

        # Cognito設定がある場合はJWKS URLを設定
        if self.user_pool_id and self.client_id:
            self.jwks_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
            logger.info(
                f"AuthService初期化 - client_id: {self.client_id}, user_pool_id: {self.user_pool_id}"
            )
        else:
            self.jwks_url = None
            logger.info("AuthService初期化 - Cognito設定なし（静的JWTのみ）")

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
                    detail=f"JWKSの取得に失敗しました: {str(e)}",
                )
        return self._jwks_cache

    def _get_signing_key(self, token: str) -> str:
        """
        JWTトークンから署名キーを取得する
        """
        try:
            # トークンのヘッダーを取得
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="トークンにkidが含まれていません",
                )

            # JWKSから対応するキーを検索
            jwks = self._get_jwks()
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    return key

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="対応する署名キーが見つかりません",
            )

        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"トークンの解析に失敗しました: {str(e)}",
            )

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        JWTトークンを検証してペイロードを返す
        """
        try:
            # トークンのヘッダーを確認してアルゴリズムを判定
            unverified_header = jwt.get_unverified_header(token)
            algorithm = unverified_header.get("alg")

            # HS256（静的JWT）の場合
            if algorithm == "HS256":
                return self._verify_mock_token(token)

            # RS256（Cognito JWT）の場合
            if algorithm == "RS256":
                if not self.jwks_url:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Cognito設定が不足しています",
                    )

                # 署名キーを取得
                signing_key = self._get_signing_key(token)

                # デバッグ: トークンの内容を確認
                unverified_payload = jwt.get_unverified_claims(token)
                logger.debug(
                    f"トークン検証開始 - aud: {unverified_payload.get('aud')}, expected: {self.client_id}"
                )

                # トークンを検証
                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=["RS256"],
                    audience=self.client_id,
                    issuer=f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}",
                )

                return payload

            # サポートされていないアルゴリズム
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"サポートされていないアルゴリズムです: {algorithm}",
            )

        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"トークンの検証に失敗しました: {str(e)}",
            )

    def _verify_mock_token(self, token: str) -> Dict[str, Any]:
        """
        local環境用の静的JWT検証
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=["HS256"],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER,
            )

            return payload

        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"モックトークンの検証に失敗しました: {str(e)}",
            )

    def get_user_from_token(self, token: str) -> Dict[str, Any]:
        """
        JWTトークンからユーザー情報を取得する
        """
        try:
            payload = self.verify_token(token)

            # Cognitoのペイロードからユーザー情報を抽出
            user_info = {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "email_verified": payload.get("email_verified", False),
                "cognito_username": payload.get("cognito:username"),
                "token_use": payload.get("token_use"),
                "auth_time": payload.get("auth_time"),
                "exp": payload.get("exp"),
                "iat": payload.get("iat"),
                "role": payload.get(
                    "custom:role", "user"
                ),  # ロールを追加（デフォルトはuser）
            }

            # カスタム属性があれば追加
            for key, value in payload.items():
                if key.startswith("custom:"):
                    user_info[key] = value

            user_id = user_info.get("user_id", "unknown")
            role = user_info.get("role", "user")
            logger.debug(
                f"トークンからユーザー情報取得成功 - sub: {user_id}, role: {role}"
            )
            return user_info
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"トークンからユーザー情報取得失敗: {str(e)}")
            raise

    def get_user_role(self, token: str) -> str:
        """
        ユーザーの役割を取得する
        """
        payload = self.verify_token(token)

        # カスタム属性からroleを取得（デフォルトはuser）
        role = payload.get("custom:role", "user")
        return role

    def require_admin_role(self, token: str) -> None:
        """
        管理者権限を要求する
        """
        role = self.get_user_role(token)
        payload = self.verify_token(token)
        user_id = payload.get("sub", "unknown")

        if role != "admin":
            logger.warning(f"管理者権限チェック失敗 - sub: {user_id}, role: {role}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="管理者権限が必要です"
            )

        logger.debug(f"管理者権限チェック成功 - sub: {user_id}")


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
