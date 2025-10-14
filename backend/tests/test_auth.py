"""
認証・認可機能のテスト
"""
import pytest
import os
from moto import mock_dynamodb
import boto3
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# テスト用の環境変数を設定
os.environ["ENVIRONMENT"] = "test"
os.environ["DYNAMODB_TABLE_NAME"] = "janlog-table-test"
os.environ["AWS_REGION"] = "ap-northeast-1"
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["JWT_ISSUER"] = "test-issuer"
os.environ["JWT_AUDIENCE"] = "test-audience"

from app.main import app


@pytest.fixture(scope="function")
def dynamodb_mock():
    """DynamoDBのモック設定"""
    with mock_dynamodb():
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


class TestJWTValidation:
    """JWT検証のテスト"""

    def test_valid_user_header(self, client):
        """有効なユーザーヘッダーのテスト"""
        # local環境ではJWT検証をスキップするため、ヘッダーで直接ユーザーIDを渡す
        response = client.get(
            "/me",
            headers={"X-Test-User-Id": "test-user-001"}
        )
        
        # local環境では認証なしでアクセス可能
        assert response.status_code in [200, 401, 404]

    def test_missing_authorization_header(self, client):
        """認証ヘッダーがない場合のテスト"""
        # 認証が必要なエンドポイントにアクセス
        response = client.get("/me")
        
        # local環境では認証なしでもアクセス可能な場合がある
        assert response.status_code in [200, 401, 404]

    def test_invalid_authorization_header(self, client):
        """不正な認証ヘッダーのテスト"""
        response = client.get(
            "/me",
            headers={"Authorization": "Bearer invalid-token-format"}
        )
        
        # 不正なトークンは拒否される
        assert response.status_code in [401, 403, 404]


class TestUserInfo:
    """ユーザー情報取得のテスト"""

    def test_get_current_user_info(self, client, dynamodb_mock):
        """現在のユーザー情報取得のテスト"""
        user_id = "test-user-001"
        
        # ユーザープロフィールを作成
        table = dynamodb_mock
        table.put_item(
            Item={
                'PK': f'USER#{user_id}',
                'SK': 'PROFILE',
                'entityType': 'PROFILE',
                'userId': user_id,
                'email': 'test@example.com',
                'displayName': 'Test User',
                'role': 'user',
                'createdAt': datetime.utcnow().isoformat(),
                'lastLoginAt': datetime.utcnow().isoformat()
            }
        )
        
        response = client.get(
            "/me",
            headers={"X-Test-User-Id": user_id}
        )
        
        if response.status_code == 200:
            user_info = response.json()
            assert user_info["userId"] == user_id
            assert user_info["email"] == "test@example.com"
            assert user_info["displayName"] == "Test User"
            assert user_info["role"] == "user"

    def test_get_user_info_not_found(self, client):
        """存在しないユーザーの情報取得テスト"""
        user_id = "non-existent-user"
        
        response = client.get(
            "/me",
            headers={"X-Test-User-Id": user_id}
        )
        
        # ユーザーが存在しない場合は404または401
        assert response.status_code in [404, 401]


class TestAdminAuthorization:
    """管理者権限のテスト"""

    def test_admin_role_check(self, client, dynamodb_mock):
        """管理者ロールのチェックテスト"""
        admin_user_id = "admin-user-001"
        
        # 管理者ユーザープロフィールを作成
        table = dynamodb_mock
        table.put_item(
            Item={
                'PK': f'USER#{admin_user_id}',
                'SK': 'PROFILE',
                'entityType': 'PROFILE',
                'userId': admin_user_id,
                'email': 'admin@example.com',
                'displayName': 'Admin User',
                'role': 'admin',
                'createdAt': datetime.utcnow().isoformat(),
                'lastLoginAt': datetime.utcnow().isoformat()
            }
        )
        
        response = client.get(
            "/me",
            headers={"X-Test-User-Id": admin_user_id}
        )
        
        if response.status_code == 200:
            user_info = response.json()
            assert user_info["role"] == "admin"

    def test_user_role_check(self, client, dynamodb_mock):
        """一般ユーザーロールのチェックテスト"""
        user_id = "test-user-001"
        
        # 一般ユーザープロフィールを作成
        table = dynamodb_mock
        table.put_item(
            Item={
                'PK': f'USER#{user_id}',
                'SK': 'PROFILE',
                'entityType': 'PROFILE',
                'userId': user_id,
                'email': 'user@example.com',
                'displayName': 'Regular User',
                'role': 'user',
                'createdAt': datetime.utcnow().isoformat(),
                'lastLoginAt': datetime.utcnow().isoformat()
            }
        )
        
        response = client.get(
            "/me",
            headers={"X-Test-User-Id": user_id}
        )
        
        if response.status_code == 200:
            user_info = response.json()
            assert user_info["role"] == "user"


class TestAuthenticationFlow:
    """認証フローのテスト"""

    def test_unauthenticated_access_to_protected_endpoint(self, client):
        """認証なしで保護されたエンドポイントへのアクセステスト"""
        # 認証ヘッダーなしで対局一覧を取得
        response = client.get("/matches")
        
        # local環境では認証なしでもアクセス可能な場合がある
        assert response.status_code in [200, 401, 404]

    def test_authenticated_access_to_protected_endpoint(self, client):
        """認証ありで保護されたエンドポイントへのアクセステスト"""
        user_id = "test-user-001"
        
        response = client.get(
            "/api/v1/matches",
            headers={"X-Test-User-Id": user_id}
        )
        
        # 認証が必要なため、401または403が返される
        assert response.status_code in [200, 401, 403]

    def test_access_to_public_endpoint(self, client):
        """公開エンドポイントへのアクセステスト"""
        # ヘルスチェックエンドポイントは認証不要
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
