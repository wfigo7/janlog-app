"""
基本データモデル
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone, timezone
from abc import ABC, abstractmethod
from decimal import Decimal


class BaseEntity(BaseModel):
    """DynamoDBエンティティの基底クラス"""

    PK: str = Field(..., description="パーティションキー")
    SK: str = Field(..., description="ソートキー")
    entityType: str = Field(..., description="エンティティタイプ")
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="作成日時",
    )
    updatedAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="更新日時",
    )

    model_config = ConfigDict(
        # DynamoDBの属性名をそのまま使用
        populate_by_name=True,
        # 追加フィールドを許可
        extra="allow",
    )

    @abstractmethod
    def get_pk(self) -> str:
        """パーティションキーを取得"""
        pass

    @abstractmethod
    def get_sk(self) -> str:
        """ソートキーを取得"""
        pass

    def to_dynamodb_item(self) -> dict:
        """DynamoDB用のアイテム形式に変換"""
        item = self.model_dump()
        item["PK"] = self.get_pk()
        item["SK"] = self.get_sk()
        item["updatedAt"] = datetime.now(timezone.utc).isoformat()

        # DynamoDB対応の型変換
        for key, value in item.items():
            if isinstance(value, float):
                item[key] = Decimal(str(value))
            elif isinstance(value, datetime):
                item[key] = value.isoformat()

        return item


class APIResponse(BaseModel):
    """API レスポンスの基底クラス"""

    success: bool = True
    message: Optional[str] = None
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """エラーレスポンス"""

    success: bool = False
    error: dict = Field(..., description="エラー情報")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    path: Optional[str] = None
