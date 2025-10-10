"""
認証関連のユーティリティ
FastAPIの依存性注入で使用する認証機能
"""

import logging
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import get_auth_service, AuthService

logger = logging.getLogger(__name__)

# HTTPベアラートークンスキーム
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> Dict[str, Any]:
    """
    現在のユーザー情報を取得する
    JWTトークンを検証してユーザー情報を返す
    """
    if not credentials:
        logger.warning("認証失敗: トークンが提供されていません")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_info = auth_service.get_user_from_token(credentials.credentials)
        user_id = user_info.get("user_id", "unknown")
        logger.debug(f"認証成功 - sub: {user_id}")
        return user_info
    except HTTPException as e:
        logger.warning(f"認証失敗: {e.detail}")
        raise
    except Exception as e:
        logger.warning(f"認証失敗: 予期しないエラー - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> str:
    """
    現在のユーザーIDを取得する
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザーIDが取得できません",
        )
    return user_id


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> Dict[str, Any]:
    """
    管理者権限を要求する
    """
    if not credentials:
        logger.warning("管理者認証失敗: トークンが提供されていません")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # トークンを検証
        user_info = auth_service.get_user_from_token(credentials.credentials)
        user_id = user_info.get("user_id", "unknown")

        # 管理者権限をチェック
        auth_service.require_admin_role(credentials.credentials)

        logger.debug(f"管理者認証成功 - sub: {user_id}")
        return user_info
    except HTTPException as e:
        user_id = user_info.get("user_id", "unknown") if "user_info" in locals() else "unknown"
        logger.warning(f"管理者認証失敗 - sub: {user_id}, reason: {e.detail}")
        raise
    except Exception as e:
        logger.warning(f"管理者認証失敗: 予期しないエラー - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="管理者権限が必要です"
        )


# オプショナル認証（トークンがなくても通す）
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> Optional[Dict[str, Any]]:
    """
    オプショナルなユーザー認証
    トークンがある場合は検証し、ない場合はNoneを返す
    """
    if not credentials:
        return None

    try:
        user_info = auth_service.get_user_from_token(credentials.credentials)
        return user_info
    except HTTPException:
        # 認証エラーの場合はNoneを返す（エラーを投げない）
        return None
    except Exception:
        return None
