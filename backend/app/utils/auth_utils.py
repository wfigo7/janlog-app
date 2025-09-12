"""
認証関連のユーティリティ
FastAPIの依存性注入で使用する認証機能
"""
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import get_auth_service, AuthService


# HTTPベアラートークンスキーム
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    現在のユーザー情報を取得する
    JWTトークンを検証してユーザー情報を返す
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_info = auth_service.get_user_from_token(credentials.credentials)
        return user_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """
    現在のユーザーIDを取得する
    """
    user_id = current_user.get('user_id')
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザーIDが取得できません"
        )
    return user_id


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    管理者権限を要求する
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # トークンを検証
        user_info = auth_service.get_user_from_token(credentials.credentials)
        
        # 管理者権限をチェック
        auth_service.require_admin_role(credentials.credentials)
        
        return user_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です"
        )


# オプショナル認証（トークンがなくても通す）
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
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