"""
会場データモデル
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from .base import BaseEntity


class Venue(BaseEntity):
    """会場エンティティ"""
    user_id: str = Field(alias="userId")
    venue_id: str = Field(alias="venueId")
    venue_name: str = Field(alias="venueName")
    usage_count: int = Field(default=0, alias="usageCount")
    last_used_at: datetime = Field(alias="lastUsedAt")

    def __init__(self, **data):
        # entityTypeを自動設定
        data["entityType"] = "VENUE"
        
        # PK/SKを自動設定（user_idとvenue_idが必要）
        if "user_id" in data and "venue_id" in data:
            data["PK"] = f"USER#{data['user_id']}"
            data["SK"] = f"VENUE#{data['venue_id']}"
        
        super().__init__(**data)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )

    def get_pk(self) -> str:
        """パーティションキー"""
        return f"USER#{self.user_id}"

    def get_sk(self) -> str:
        """ソートキー"""
        return f"VENUE#{self.venue_id}"


class VenueInput(BaseModel):
    """会場入力データ"""
    venue_name: str = Field(alias="venueName")

    model_config = ConfigDict(populate_by_name=True)


class VenueResponse(BaseModel):
    """会場レスポンスデータ"""
    venue_id: str = Field(alias="venueId")
    venue_name: str = Field(alias="venueName")
    usage_count: int = Field(alias="usageCount")
    last_used_at: datetime = Field(alias="lastUsedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )