#!/usr/bin/env python3
"""
ローカル開発環境用DynamoDBテーブル作成スクリプト
"""
import boto3
import os
import sys
from botocore.exceptions import ClientError

def create_dynamodb_table():
    """
    DynamoDB Localにjanlog-tableを作成する
    """
    # DynamoDB Localのエンドポイント
    endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://localhost:8000')
    region_name = os.getenv('AWS_REGION', 'ap-northeast-1')
    table_name = os.getenv('DYNAMODB_TABLE_NAME', 'janlog-table')
    
    # DynamoDB Localクライアント作成
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    try:
        # 既存テーブルの確認
        existing_table = dynamodb.Table(table_name)
        existing_table.load()
        print(f"テーブル '{table_name}' は既に存在します")
        return True
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
            print(f"テーブル確認エラー: {e}")
            return False
    
    # テーブル作成
    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'PK',
                    'KeyType': 'HASH'  # Partition Key
                },
                {
                    'AttributeName': 'SK',
                    'KeyType': 'RANGE'  # Sort Key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'PK',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'SK',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'GSI1PK',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'GSI1SK',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {
                            'AttributeName': 'GSI1PK',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'GSI1SK',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # テーブル作成完了まで待機
        table.wait_until_exists()
        print(f"テーブル '{table_name}' を作成しました")
        
        # テーブル情報を表示
        print(f"テーブル状態: {table.table_status}")
        print(f"テーブルARN: {table.table_arn}")
        
        return True
        
    except ClientError as e:
        print(f"テーブル作成エラー: {e}")
        return False

def create_sample_data():
    """
    サンプルデータを作成する（開発用）
    """
    endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://localhost:8000')
    region_name = os.getenv('AWS_REGION', 'ap-northeast-1')
    table_name = os.getenv('DYNAMODB_TABLE_NAME', 'janlog-table')
    
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    table = dynamodb.Table(table_name)
    
    # サンプルユーザープロフィール
    sample_profile = {
        'PK': 'USER#test-user-1',
        'SK': 'PROFILE',
        'entityType': 'PROFILE',
        'userId': 'test-user-1',
        'email': 'test@example.com',
        'displayName': 'テストユーザー',
        'role': 'user',
        'createdAt': '2024-01-01T00:00:00Z',
        'lastLoginAt': '2024-01-01T00:00:00Z'
    }
    
    # サンプルルールセット（4人麻雀）
    sample_ruleset_4p = {
        'PK': 'USER#test-user-1',
        'SK': 'RULESET#default-4p',
        'entityType': 'RULESET',
        'rulesetId': 'default-4p',
        'ruleName': 'デフォルト4人麻雀',
        'gameMode': 'four',
        'uma': {
            'first': 20,
            'second': 10,
            'third': -10,
            'fourth': -20
        },
        'oka': 25,
        'isDefault': True,
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }
    
    # サンプルルールセット（3人麻雀）
    sample_ruleset_3p = {
        'PK': 'USER#test-user-1',
        'SK': 'RULESET#default-3p',
        'entityType': 'RULESET',
        'rulesetId': 'default-3p',
        'ruleName': 'デフォルト3人麻雀',
        'gameMode': 'three',
        'uma': {
            'first': 15,
            'second': 0,
            'third': -15
        },
        'oka': 20,
        'isDefault': True,
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }
    
    # サンプル対局データ
    sample_match = {
        'PK': 'USER#test-user-1',
        'SK': 'MATCH#match-001',
        'entityType': 'MATCH',
        'matchId': 'match-001',
        'date': '2024-01-01T12:00:00Z',
        'gameMode': 'four',
        'entryMethod': 'rank_plus_points',
        'rulesetId': 'default-4p',
        'rank': 2,
        'finalPoints': 10,
        'chipCount': 0,
        'createdAt': '2024-01-01T12:00:00Z',
        'updatedAt': '2024-01-01T12:00:00Z',
        # GSI用属性
        'GSI1PK': 'USER#test-user-1#MATCH',
        'GSI1SK': '2024-01-01T12:00:00Z'
    }
    
    try:
        # サンプルデータを挿入
        table.put_item(Item=sample_profile)
        table.put_item(Item=sample_ruleset_4p)
        table.put_item(Item=sample_ruleset_3p)
        table.put_item(Item=sample_match)
        
        print("サンプルデータを作成しました:")
        print("- テストユーザープロフィール")
        print("- デフォルトルールセット（4人麻雀・3人麻雀）")
        print("- サンプル対局データ")
        
        return True
        
    except ClientError as e:
        print(f"サンプルデータ作成エラー: {e}")
        return False

def main():
    """メイン処理"""
    print("=== Janlog ローカル開発環境 DynamoDB セットアップ ===")
    
    # 環境変数の表示
    endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://localhost:8000')
    table_name = os.getenv('DYNAMODB_TABLE_NAME', 'janlog-table')
    
    print(f"DynamoDB Endpoint: {endpoint_url}")
    print(f"テーブル名: {table_name}")
    print()
    
    # テーブル作成
    print("1. テーブル作成中...")
    if not create_dynamodb_table():
        print("テーブル作成に失敗しました")
        sys.exit(1)
    
    # サンプルデータ作成（オプション）
    if len(sys.argv) > 1 and sys.argv[1] == '--with-sample-data':
        print("\n2. サンプルデータ作成中...")
        if not create_sample_data():
            print("サンプルデータ作成に失敗しました")
            sys.exit(1)
    
    print("\n✅ セットアップ完了!")
    print("\nDynamoDB Localが起動していることを確認してください:")
    print(f"  docker-compose up -d")
    print(f"\nテーブル確認:")
    print(f"  aws dynamodb list-tables --endpoint-url {endpoint_url}")

if __name__ == "__main__":
    main()