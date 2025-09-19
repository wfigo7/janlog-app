"""
DynamoDB関連のユーティリティ
"""
import boto3
import os
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional, List
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

class DynamoDBClient:
    """DynamoDBクライアントクラス"""
    
    def __init__(self):
        """DynamoDBクライアントを初期化"""
        if settings.ENVIRONMENT == "test":
            # テスト環境用（moto使用）
            self.dynamodb = boto3.resource('dynamodb', region_name=settings.AWS_REGION)
        elif settings.is_development or settings.is_local:
            # ローカル開発環境用（DynamoDB Local使用時）
            endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL')
            if endpoint_url:
                logger.info(f"DynamoDB Local接続: {endpoint_url}")
                self.dynamodb = boto3.resource(
                    'dynamodb',
                    region_name=settings.AWS_REGION,
                    endpoint_url=endpoint_url,
                    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', 'dummy'),
                    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', 'dummy')
                )
            else:
                logger.warning("DYNAMODB_ENDPOINT_URLが設定されていません。AWS DynamoDBに接続します。")
                self.dynamodb = boto3.resource('dynamodb', region_name=settings.AWS_REGION)
        else:
            # AWS環境用
            self.dynamodb = boto3.resource('dynamodb', region_name=settings.AWS_REGION)
        
        self.table = self.dynamodb.Table(settings.DYNAMODB_TABLE_NAME)
    
    async def put_item(self, table_name: str, item: Dict[str, Any]) -> bool:
        """アイテムを追加"""
        try:
            self.table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB put_item error: {e}")
            return False
    
    async def get_item(self, table_name: str, pk: str, sk: str) -> Optional[Dict[str, Any]]:
        """アイテムを取得"""
        try:
            response = self.table.get_item(
                Key={'PK': pk, 'SK': sk}
            )
            return response.get('Item')
        except ClientError as e:
            logger.error(f"DynamoDB get_item error: {e}")
            return None
    
    async def query_items(
        self, 
        table_name: str,
        key_condition_expression: str,
        expression_attribute_values: Dict[str, Any],
        filter_expression: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """アイテムをクエリ"""
        try:
            query_params = {
                'KeyConditionExpression': key_condition_expression,
                'ExpressionAttributeValues': expression_attribute_values
            }
            
            if filter_expression:
                query_params['FilterExpression'] = filter_expression
            
            if expression_attribute_names:
                query_params['ExpressionAttributeNames'] = expression_attribute_names
            
            if limit:
                query_params['Limit'] = limit
            
            response = self.table.query(**query_params)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB query error: {e}")
            return []

    async def query_items_with_pagination(
        self, 
        table_name: str,
        key_condition_expression: str,
        expression_attribute_values: Dict[str, Any],
        filter_expression: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        limit: Optional[int] = None,
        exclusive_start_key: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """ページネーション対応のアイテムクエリ"""
        try:
            query_params = {
                'KeyConditionExpression': key_condition_expression,
                'ExpressionAttributeValues': expression_attribute_values
            }
            
            if filter_expression:
                query_params['FilterExpression'] = filter_expression
            
            if expression_attribute_names:
                query_params['ExpressionAttributeNames'] = expression_attribute_names
            
            if limit:
                query_params['Limit'] = limit
            
            if exclusive_start_key:
                query_params['ExclusiveStartKey'] = exclusive_start_key
            
            response = self.table.query(**query_params)
            
            return {
                'items': response.get('Items', []),
                'last_evaluated_key': response.get('LastEvaluatedKey'),
                'count': response.get('Count', 0),
                'scanned_count': response.get('ScannedCount', 0)
            }
        except ClientError as e:
            logger.error(f"DynamoDB query with pagination error: {e}")
            return {
                'items': [],
                'last_evaluated_key': None,
                'count': 0,
                'scanned_count': 0
            }
    
    async def update_item(
        self, 
        pk: str, 
        sk: str, 
        update_expression: str,
        expression_attribute_values: Dict[str, Any]
    ) -> bool:
        """アイテムを更新"""
        try:
            self.table.update_item(
                Key={'PK': pk, 'SK': sk},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values
            )
            return True
        except ClientError as e:
            logger.error(f"DynamoDB update_item error: {e}")
            return False
    
    async def delete_item(self, table_name: str, pk: str, sk: str) -> bool:
        """アイテムを削除"""
        try:
            self.table.delete_item(
                Key={'PK': pk, 'SK': sk}
            )
            return True
        except ClientError as e:
            logger.error(f"DynamoDB delete_item error: {e}")
            return False
    
    async def scan_items(
        self,
        table_name: str,
        filter_expression: Optional[str] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """テーブル全体をスキャン"""
        try:
            scan_params = {}
            
            if filter_expression:
                scan_params['FilterExpression'] = filter_expression
            
            if expression_attribute_values:
                scan_params['ExpressionAttributeValues'] = expression_attribute_values
            
            if expression_attribute_names:
                scan_params['ExpressionAttributeNames'] = expression_attribute_names
            
            if limit:
                scan_params['Limit'] = limit
            
            response = self.table.scan(**scan_params)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB scan error: {e}")
            return []
    
    async def health_check(self) -> bool:
        """DynamoDBの接続確認"""
        try:
            # テーブルの存在確認
            self.table.load()
            return True
        except Exception as e:
            logger.error(f"DynamoDB health check failed: {e}")
            return False

# グローバルDynamoDBクライアントインスタンス（遅延初期化）
dynamodb_client = None

def get_dynamodb_client() -> DynamoDBClient:
    """DynamoDBクライアントを取得（シングルトンパターン）"""
    global dynamodb_client
    if dynamodb_client is None:
        dynamodb_client = DynamoDBClient()
    return dynamodb_client

def reset_dynamodb_client():
    """DynamoDBクライアントをリセット（テスト用）"""
    global dynamodb_client
    dynamodb_client = None