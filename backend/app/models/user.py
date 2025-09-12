"""
ユーザー関連のデータモデル
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserProfile(BaseModel):
    """ユーザープロフィール"""
    user_id: str
    email: str
    display_name: Optional[str] = None
    role: str = "user"  # user | admin
    invited_by: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserResponse(BaseModel):
    """ユーザー情報レスポンス"""
    user_id: str
    email: str
    display_name: Optional[str] = None
    role: str
    last_login_at: Optional[str] = None


# 招待機能はCognitoコンソールから直接実行するため、リクエスト/レスポンスモデルは不要