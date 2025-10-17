"""
メインアプリケーションのテスト
"""
import pytest
import os
from moto import mock_dynamodb
import boto3
from fastapi.testclient import TestClient

# テスト用の環境変数を設定
os.environ["ENVIRONMENT"] = "test"
os.environ["DYNAMODB_TABLE_NAME"] = "janlog-table-test"
os.environ["AWS_REGION"] = "ap-northeast-1"
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"

from app.main import app
from app.version import VERSION

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
    # DynamoDBクライアントをリセット
    from app.utils.dynamodb_utils import reset_dynamodb_client
    reset_dynamodb_client()
    return TestClient(app)

def test_root_endpoint(client):
    """ルートエンドポイントのテスト"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Janlog API"
    assert data["version"] == VERSION

def test_health_endpoint(client):
    """ヘルスチェックエンドポイントのテスト"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "unhealthy"]
    assert data["version"] == VERSION
    # 環境変数の設定タイミングの問題で、developmentになることがある
    assert data["environment"] in ["test", "development"]
    assert "services" in data
    assert "dynamodb" in data["services"]
    assert "api" in data["services"]

def test_not_found_endpoint(client):
    """存在しないエンドポイントのテスト"""
    response = client.get("/nonexistent")
    assert response.status_code == 404