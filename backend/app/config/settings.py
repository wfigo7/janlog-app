"""
アプリケーション設定
"""
import os
from typing import Optional


class Settings:
    """アプリケーション設定クラス"""

    # 環境設定
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # DynamoDB設定
    DYNAMODB_TABLE_NAME: str = os.getenv("DYNAMODB_TABLE_NAME", "janlog-table")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-northeast-1")

    # Cognito設定
    COGNITO_USER_POOL_ID: Optional[str] = os.getenv("COGNITO_USER_POOL_ID")
    COGNITO_CLIENT_ID: Optional[str] = os.getenv("COGNITO_CLIENT_ID")

    # JWT設定
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "development-secret-key")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24時間

    @property
    def is_development(self) -> bool:
        """開発環境かどうかを判定"""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """本番環境かどうかを判定"""
        return self.ENVIRONMENT == "production"


# グローバル設定インスタンス
settings = Settings()
