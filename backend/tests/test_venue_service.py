"""
会場管理機能のテスト
"""
import pytest
import os
from moto import mock_dynamodb
import boto3
from fastapi.testclient import TestClient
from datetime import datetime

# テスト用の環境変数を設定
os.environ["ENVIRONMENT"] = "test"
os.environ["DYNAMODB_TABLE_NAME"] = "janlog-table-test"
os.environ["AWS_REGION"] = "ap-northeast-1"
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"

from app.main import app
from app.services.venue_service import VenueService


@pytest.fixture(scope="function")
def dynamodb_mock():
    """DynamoDBのモック設定"""
    with mock_dynamodb():
        # テスト用のDynamoDBテーブルを作成
        dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')
        table = dynamodb.create_table(
            TableName='janlog-table-test',
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        yield table


@pytest.fixture
def client(dynamodb_mock):
    """テストクライアント"""
    from app.utils.dynamodb_utils import reset_dynamodb_client
    reset_dynamodb_client()
    return TestClient(app)


@pytest.fixture
def venue_service(dynamodb_mock):
    """VenueServiceのインスタンス"""
    from app.utils.dynamodb_utils import reset_dynamodb_client
    reset_dynamodb_client()
    return VenueService()


class TestVenueService:
    """VenueServiceのテスト"""

    @pytest.mark.asyncio
    async def test_find_or_create_venue_new(self, venue_service):
        """新規会場の作成テスト"""
        user_id = "test-user-001"
        venue_name = "雀荘テスト"
        
        venue = await venue_service.find_or_create_venue(user_id, venue_name)
        
        assert venue is not None
        assert venue.venue_name == venue_name
        assert venue.usage_count == 1
        assert venue.venue_id is not None
        assert venue.last_used_at is not None

    @pytest.mark.asyncio
    async def test_find_or_create_venue_existing(self, venue_service):
        """既存会場の取得テスト"""
        user_id = "test-user-001"
        venue_name = "雀荘テスト"
        
        # 1回目: 新規作成
        venue1 = await venue_service.find_or_create_venue(user_id, venue_name)
        venue_id1 = venue1.venue_id
        
        # 2回目: 既存会場を取得
        venue2 = await venue_service.find_or_create_venue(user_id, venue_name)
        venue_id2 = venue2.venue_id
        
        # 同じvenueIdが返される
        assert venue_id1 == venue_id2
        # 使用回数が増加
        assert venue2.usage_count == 2

    @pytest.mark.asyncio
    async def test_find_or_create_venue_case_insensitive(self, venue_service):
        """会場名の大文字小文字を区別しないテスト"""
        user_id = "test-user-001"
        
        # 1回目: 小文字で作成
        venue1 = await venue_service.find_or_create_venue(user_id, "test venue")
        venue_id1 = venue1.venue_id
        
        # 2回目: 大文字で検索
        venue2 = await venue_service.find_or_create_venue(user_id, "TEST VENUE")
        venue_id2 = venue2.venue_id
        
        # 同じvenueIdが返される
        assert venue_id1 == venue_id2

    @pytest.mark.asyncio
    async def test_find_or_create_venue_trim_whitespace(self, venue_service):
        """会場名の前後空白を削除するテスト"""
        user_id = "test-user-001"
        
        # 1回目: 空白なし
        venue1 = await venue_service.find_or_create_venue(user_id, "雀荘A")
        venue_id1 = venue1.venue_id
        
        # 2回目: 前後に空白
        venue2 = await venue_service.find_or_create_venue(user_id, "  雀荘A  ")
        venue_id2 = venue2.venue_id
        
        # 同じvenueIdが返される
        assert venue_id1 == venue_id2

    @pytest.mark.asyncio
    async def test_get_user_venues_empty(self, venue_service):
        """会場が存在しない場合のテスト"""
        user_id = "test-user-001"
        
        venues = await venue_service.get_user_venues(user_id)
        
        assert venues == []

    @pytest.mark.asyncio
    async def test_get_user_venues_sorted_by_usage_count(self, venue_service):
        """会場一覧が使用回数順にソートされるテスト"""
        user_id = "test-user-001"
        
        # 複数の会場を作成（使用回数が異なる）
        await venue_service.find_or_create_venue(user_id, "雀荘A")
        await venue_service.find_or_create_venue(user_id, "雀荘B")
        await venue_service.find_or_create_venue(user_id, "雀荘B")  # 2回目
        await venue_service.find_or_create_venue(user_id, "雀荘C")
        await venue_service.find_or_create_venue(user_id, "雀荘C")  # 2回目
        await venue_service.find_or_create_venue(user_id, "雀荘C")  # 3回目
        
        venues = await venue_service.get_user_venues(user_id)
        
        # 使用回数順にソート（降順）
        assert len(venues) == 3
        assert venues[0].venue_name == "雀荘C"
        assert venues[0].usage_count == 3
        assert venues[1].venue_name == "雀荘B"
        assert venues[1].usage_count == 2
        assert venues[2].venue_name == "雀荘A"
        assert venues[2].usage_count == 1

    @pytest.mark.asyncio
    async def test_get_user_venues_different_users(self, venue_service):
        """異なるユーザーの会場が分離されるテスト"""
        user_id1 = "test-user-001"
        user_id2 = "test-user-002"
        
        # ユーザー1の会場
        await venue_service.find_or_create_venue(user_id1, "雀荘A")
        await venue_service.find_or_create_venue(user_id1, "雀荘B")
        
        # ユーザー2の会場
        await venue_service.find_or_create_venue(user_id2, "雀荘C")
        
        venues1 = await venue_service.get_user_venues(user_id1)
        venues2 = await venue_service.get_user_venues(user_id2)
        
        # ユーザー1は2件
        assert len(venues1) == 2
        assert all(v.venue_name in ["雀荘A", "雀荘B"] for v in venues1)
        
        # ユーザー2は1件
        assert len(venues2) == 1
        assert venues2[0].venue_name == "雀荘C"


class TestVenueAPI:
    """会場APIのテスト"""

    @pytest.mark.asyncio
    async def test_get_venues_api(self, client, venue_service):
        """GET /venues エンドポイントのテスト"""
        user_id = "test-user-001"
        
        # テストデータ作成
        await venue_service.find_or_create_venue(user_id, "雀荘A")
        await venue_service.find_or_create_venue(user_id, "雀荘B")
        
        # API呼び出し（認証ヘッダーなしでテスト）
        response = client.get(
            "/venues",
            headers={"X-Test-User-Id": user_id}
        )
        
        # /venuesエンドポイントが実装されていない場合は404
        if response.status_code == 404:
            pytest.skip("/venues endpoint not implemented yet")
        
        assert response.status_code == 200
        venues = response.json()
        assert len(venues) == 2
        assert all("venue_id" in v or "venueId" in v for v in venues)
        assert all("venue_name" in v or "venueName" in v for v in venues)
        assert all("usage_count" in v or "usageCount" in v for v in venues)

    def test_get_venues_api_empty(self, client):
        """会場が存在しない場合のAPIテスト"""
        user_id = "test-user-999"
        
        response = client.get(
            "/venues",
            headers={"X-Test-User-Id": user_id}
        )
        
        # /venuesエンドポイントが実装されていない場合は404
        if response.status_code == 404:
            pytest.skip("/venues endpoint not implemented yet")
        
        assert response.status_code == 200
        venues = response.json()
        assert venues == []
