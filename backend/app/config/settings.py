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
    DYNAMODB_ENDPOINT_URL: Optional[str] = os.getenv("DYNAMODB_ENDPOINT_URL")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-northeast-1")
    
    # Cognito設定
    COGNITO_USER_POOL_ID: Optional[str] = os.getenv("COGNITO_USER_POOL_ID")
    COGNITO_CLIENT_ID: Optional[str] = os.getenv("COGNITO_CLIENT_ID")
    
    # JWT設定
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "development-secret-key")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24時間
    
    # local環境用JWT設定
    JWT_ISSUER: Optional[str] = os.getenv("JWT_ISSUER")
    JWT_AUDIENCE: Optional[str] = os.getenv("JWT_AUDIENCE")
    
    @property
    def is_development(self) -> bool:
        """開発環境かどうかを判定"""
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """本番環境かどうかを判定"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_local(self) -> bool:
        """ローカル環境かどうかを判定"""
        return self.ENVIRONMENT == "local"
    
    @property
    def use_mock_jwt(self) -> bool:
        """モックJWTを使用するかどうかを判定"""
        return self.is_local and self.JWT_ISSUER == "mock-issuer"

# グローバル設定インスタンス
settings = Settings()