"""
会場管理サービス
"""

import uuid
from datetime import datetime
from typing import List, Optional
from boto3.dynamodb.conditions import Key

from ..models.venue import Venue, VenueInput, VenueResponse
from ..utils.dynamodb_utils import get_dynamodb_client


class VenueService:
    """会場管理サービス"""

    def __init__(self):
        self.dynamodb_client = get_dynamodb_client()
        self.table = self.dynamodb_client.table

    async def get_user_venues(self, user_id: str) -> List[VenueResponse]:
        """ユーザーの会場一覧を取得（使用回数順）"""
        try:
            response = self.table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}")
                & Key("SK").begins_with("VENUE#")
            )

            venues = []
            for item in response.get("Items", []):
                # DynamoDBから取得したitemを直接VenueResponseに変換
                venues.append(
                    VenueResponse(
                        venue_id=item.get("venue_id") or item.get("venueId"),
                        venue_name=item.get("venue_name") or item.get("venueName"),
                        usage_count=item.get("usage_count", 0) or item.get("usageCount", 0),
                        last_used_at=datetime.fromisoformat(item.get("last_used_at") or item.get("lastUsedAt")),
                        created_at=datetime.fromisoformat(item.get("createdAt")),
                        updated_at=datetime.fromisoformat(item.get("updatedAt")),
                    )
                )

            # 使用回数順（降順）でソート
            venues.sort(key=lambda x: x.usage_count, reverse=True)
            return venues

        except Exception as e:
            print(f"Error getting user venues: {e}")
            return []

    async def find_or_create_venue(self, user_id: str, venue_name: str) -> Venue:
        """会場を検索または作成（重複チェック付き）"""
        # 正規化された会場名で検索
        normalized_name = self._normalize_venue_name(venue_name)

        # 既存会場を検索
        existing_venue = await self._find_venue_by_name(user_id, normalized_name)

        if existing_venue:
            # 既存会場の使用回数を更新
            await self._update_venue_usage(existing_venue)
            return existing_venue
        else:
            # 新規会場を作成
            return await self._create_new_venue(user_id, venue_name)

    async def _find_venue_by_name(
        self, user_id: str, normalized_name: str
    ) -> Optional[Venue]:
        """正規化された名前で会場を検索"""
        try:
            response = self.table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}")
                & Key("SK").begins_with("VENUE#")
            )

            for item in response.get("Items", []):
                venue_name = item.get("venue_name") or item.get("venueName")
                if self._normalize_venue_name(venue_name) == normalized_name:
                    # 見つかった場合はVenueオブジェクトを作成して返す
                    return Venue(
                        user_id=user_id,
                        venue_id=item.get("venue_id") or item.get("venueId"),
                        venue_name=venue_name,
                        usage_count=item.get("usage_count", 0) or item.get("usageCount", 0),
                        last_used_at=datetime.fromisoformat(item.get("last_used_at") or item.get("lastUsedAt")),
                        PK=item.get("PK"),
                        SK=item.get("SK"),
                        entityType=item.get("entityType"),
                        createdAt=item.get("createdAt"),
                        updatedAt=item.get("updatedAt"),
                    )

            return None

        except Exception as e:
            print(f"Error finding venue by name: {e}")
            return None

    async def _create_new_venue(self, user_id: str, venue_name: str) -> Venue:
        """新規会場を作成"""
        now = datetime.utcnow()
        venue_id = str(uuid.uuid4())

        venue = Venue(
            user_id=user_id,
            venue_id=venue_id,
            venue_name=venue_name.strip(),
            usage_count=1,
            last_used_at=now,
        )

        # DynamoDBに保存
        item = venue.to_dynamodb_item()
        self.table.put_item(Item=item)
        return venue

    async def _update_venue_usage(self, venue: Venue) -> None:
        """会場の使用回数と最終使用日時を更新"""
        now = datetime.utcnow()

        # DynamoDBの属性名を確認して適切に更新
        self.table.update_item(
            Key={"PK": venue.get_pk(), "SK": venue.get_sk()},
            UpdateExpression="SET #uc = #uc + :inc, #lua = :now, #ua = :now",
            ExpressionAttributeNames={
                "#uc": "usage_count",  # snake_case
                "#lua": "last_used_at",  # snake_case
                "#ua": "updatedAt",  # camelCase
            },
            ExpressionAttributeValues={
                ":inc": 1,
                ":now": now.isoformat(),
            },
        )

        # オブジェクトも更新
        venue.usage_count += 1
        venue.last_used_at = now
        venue.updatedAt = now.isoformat()

    def _normalize_venue_name(self, name: str) -> str:
        """会場名を正規化（重複チェック用）"""
        return name.strip().lower().replace(" ", "").replace("　", "")


# シングルトンインスタンス
venue_service = VenueService()
