#!/usr/bin/env python3
"""
ローカル開発環境用DynamoDBテーブル作成スクリプト
"""
import boto3
import os
import sys
import uuid
from datetime import datetime, timezone
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# .env.localファイルを読み込み（scriptsディレクトリから実行されるため）
load_dotenv("../.env.local")
from dotenv import load_dotenv
from dotenv import load_dotenv

# .env.localファイルを固定で読み込み
load_dotenv("../.env.local")


def delete_existing_table():
    """
    既存のテーブルを削除する
    """
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
    region_name = os.getenv("AWS_REGION", "ap-northeast-1")
    table_name = os.getenv("DYNAMODB_TABLE_NAME", "janlog-table-local")

    dynamodb = boto3.resource(
        "dynamodb",
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id="dummy",
        aws_secret_access_key="dummy",
    )

    try:
        table = dynamodb.Table(table_name)
        table.load()
        print(f"既存テーブル '{table_name}' を削除中...")
        table.delete()
        table.wait_until_not_exists()
        print(f"テーブル '{table_name}' を削除しました")
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            print(f"テーブル '{table_name}' は存在しません")
            return True
        else:
            print(f"テーブル削除エラー: {e}")
            return False


def create_dynamodb_table():
    """
    DynamoDB Localにjanlog-table-localを作成する
    """
    # DynamoDB Localのエンドポイント
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
    region_name = os.getenv("AWS_REGION", "ap-northeast-1")
    table_name = os.getenv("DYNAMODB_TABLE_NAME", "janlog-table-local")

    # DynamoDB Localクライアント作成
    dynamodb = boto3.resource(
        "dynamodb",
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id="dummy",
        aws_secret_access_key="dummy",
    )

    # テーブル作成
    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},  # Partition Key
                {"AttributeName": "SK", "KeyType": "RANGE"},  # Sort Key
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
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
    サンプルデータを作成する（test-user-001用）
    """
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
    region_name = os.getenv("AWS_REGION", "ap-northeast-1")
    table_name = os.getenv("DYNAMODB_TABLE_NAME", "janlog-table-local")

    dynamodb = boto3.resource(
        "dynamodb",
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id="dummy",
        aws_secret_access_key="dummy",
    )

    table = dynamodb.Table(table_name)

    # 現在時刻
    now = datetime.now(timezone.utc).isoformat()

    # サンプルユーザープロフィール（test-user-001）
    sample_profile = {
        "PK": "USER#test-user-001",
        "SK": "PROFILE",
        "entityType": "PROFILE",
        "userId": "test-user-001",
        "email": "test@example.com",
        "displayName": "テストユーザー",
        "role": "user",
        "createdAt": now,
        "lastLoginAt": now,
    }

    # サンプルルールセット（4人麻雀）
    sample_ruleset_4p = {
        "PK": "USER#test-user-001",
        "SK": "RULESET#default-4p",
        "entityType": "RULESET",
        "rulesetId": "default-4p",
        "ruleName": "デフォルト4人麻雀",
        "gameMode": "four",
        "uma": {"first": 20, "second": 10, "third": -10, "fourth": -20},
        "oka": 25,
        "isDefault": True,
        "createdAt": now,
        "updatedAt": now,
    }

    # サンプルルールセット（3人麻雀）
    sample_ruleset_3p = {
        "PK": "USER#test-user-001",
        "SK": "RULESET#default-3p",
        "entityType": "RULESET",
        "rulesetId": "default-3p",
        "ruleName": "デフォルト3人麻雀",
        "gameMode": "three",
        "uma": {"first": 15, "second": 0, "third": -15},
        "oka": 20,
        "isDefault": True,
        "createdAt": now,
        "updatedAt": now,
    }

    # サンプル対局データ（複数パターン）
    sample_matches = []

    # 1. 順位+最終スコア（4人麻雀）
    match_id_1 = str(uuid.uuid4())
    sample_matches.append(
        {
            "PK": "USER#test-user-001",
            "SK": f"MATCH#{match_id_1}",
            "entityType": "MATCH",
            "matchId": match_id_1,
            "userId": "test-user-001",
            "date": "2024-01-15T14:30:00Z",
            "gameMode": "four",
            "entryMethod": "rank_plus_points",
            "rulesetId": "default-4p",
            "rank": 2,
            "finalPoints": 25000,
            "rawScore": None,
            "chipCount": 5,
            "venueId": None,
            "memo": "順位+最終スコアのテスト",
            "createdAt": now,
            "updatedAt": now,
            # GSI用属性
            "GSI1PK": "USER#test-user-001#MATCH",
            "GSI1SK": "2024-01-15T14:30:00Z",
        }
    )

    # 2. 順位+素点（3人麻雀）
    match_id_2 = str(uuid.uuid4())
    sample_matches.append(
        {
            "PK": "USER#test-user-001",
            "SK": f"MATCH#{match_id_2}",
            "entityType": "MATCH",
            "matchId": match_id_2,
            "userId": "test-user-001",
            "date": "2024-01-20T19:00:00Z",
            "gameMode": "three",
            "entryMethod": "rank_plus_raw",
            "rulesetId": "default-3p",
            "rank": 1,
            "finalPoints": None,
            "rawScore": 35000,
            "chipCount": 10,
            "venueId": None,
            "memo": "順位+素点のテスト",
            "createdAt": now,
            "updatedAt": now,
            # GSI用属性
            "GSI1PK": "USER#test-user-001#MATCH",
            "GSI1SK": "2024-01-20T19:00:00Z",
        }
    )

    # 3. 仮スコア（4人麻雀）
    match_id_3 = str(uuid.uuid4())
    sample_matches.append(
        {
            "PK": "USER#test-user-001",
            "SK": f"MATCH#{match_id_3}",
            "entityType": "MATCH",
            "matchId": match_id_3,
            "userId": "test-user-001",
            "date": "2024-01-25T16:45:00Z",
            "gameMode": "four",
            "entryMethod": "provisional_rank_only",
            "rulesetId": None,
            "rank": 3,
            "finalPoints": None,
            "rawScore": None,
            "chipCount": None,
            "venueId": None,
            "memo": "仮スコアのテスト",
            "createdAt": now,
            "updatedAt": now,
            # GSI用属性
            "GSI1PK": "USER#test-user-001#MATCH",
            "GSI1SK": "2024-01-25T16:45:00Z",
        }
    )

    try:
        # サンプルデータを挿入
        table.put_item(Item=sample_profile)
        table.put_item(Item=sample_ruleset_4p)
        table.put_item(Item=sample_ruleset_3p)

        for match in sample_matches:
            table.put_item(Item=match)

        print("サンプルデータを作成しました:")
        print("- テストユーザープロフィール (test-user-001)")
        print("- デフォルトルールセット（4人麻雀・3人麻雀）")
        print(f"- サンプル対局データ ({len(sample_matches)}件)")
        print("  - 順位+最終スコア（4人麻雀）")
        print("  - 順位+素点（3人麻雀）")
        print("  - 仮スコア（4人麻雀）")

        return True

    except ClientError as e:
        print(f"サンプルデータ作成エラー: {e}")
        return False


def main():
    """メイン処理"""
    print("=== Janlog ローカル開発環境 DynamoDB セットアップ ===")

    # .env.localファイルを読み込み（backendディレクトリから実行される場合を考慮）

    # 現在のディレクトリから.env.localを探す
    if os.path.exists(".env.local"):
        load_dotenv(".env.local")
        print("✅ .env.localを読み込みました")
    elif os.path.exists("../.env.local"):
        load_dotenv("../.env.local")
        print("✅ ../.env.localを読み込みました")
    else:
        print("⚠️  .env.localファイルが見つかりません。デフォルト値を使用します")

    # .env.localから環境変数を取得
    endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
    table_name = os.getenv("DYNAMODB_TABLE_NAME", "janlog-table-local")
    environment = os.getenv("ENVIRONMENT", "local")

    print(f"環境: {environment}")
    print(f"DynamoDB Endpoint: {endpoint_url}")
    print(f"テーブル名: {table_name}")

    # local環境以外では実行しない
    if environment != "local":
        print("❌ このスクリプトはlocal環境専用です")
        print("ENVIRONMENT=local が .env.local に設定されていることを確認してください")
        sys.exit(1)

    print()

    # 既存テーブル削除
    print("1. 既存テーブル削除中...")
    if not delete_existing_table():
        print("既存テーブル削除に失敗しました")
        sys.exit(1)

    # テーブル作成
    print("\n2. テーブル作成中...")
    if not create_dynamodb_table():
        print("テーブル作成に失敗しました")
        sys.exit(1)

    # サンプルデータ作成（デフォルトで作成）
    print("\n3. サンプルデータ作成中...")
    if not create_sample_data():
        print("サンプルデータ作成に失敗しました")
        sys.exit(1)

    print("\n✅ セットアップ完了!")
    print("\n作成されたデータ:")
    print("- ユーザー: test-user-001")
    print("- ルールセット: default-4p, default-3p")
    print("- 対局データ: 3件（各入力方式のサンプル）")
    print(f"\nテーブル確認:")
    print(
        f"  aws dynamodb scan --table-name {table_name} --endpoint-url {endpoint_url}"
    )
    print(f"\nDynamoDB管理画面: http://localhost:8001")


if __name__ == "__main__":
    main()
