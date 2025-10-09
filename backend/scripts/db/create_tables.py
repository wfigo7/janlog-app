#!/usr/bin/env python3
"""
DynamoDBテーブル作成スクリプト

このスクリプトは、指定された環境（local/development/production）に
DynamoDBテーブルを作成します。

使用方法:
    python create_tables.py --environment local
    python create_tables.py --environment local --recreate
    python create_tables.py --environment development --clear-data

オプション:
    --environment: 環境名（local/development/production）デフォルト: local
    --recreate: 既存テーブルを削除してから再作成（local環境のみ）
    --clear-data: テーブル内の全データを削除（local/development環境のみ）
    --force: 確認なしで実行（危険）
"""

import argparse
import sys
from pathlib import Path

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from scripts.db.utils import (
    load_env_file,
    get_dynamodb_client,
    get_table_name,
    validate_environment,
    print_environment_info,
    print_success,
    print_error,
    print_warning,
    print_info,
    print_header,
    confirm_action,
    check_dynamodb_connection,
    table_exists,
)
from botocore.exceptions import ClientError


def create_table(environment: str) -> bool:
    """
    DynamoDBテーブルを作成する

    Args:
        environment: 環境名（local/development/production）

    Returns:
        作成成功時True、失敗時False
    """
    try:
        dynamodb = get_dynamodb_client(environment)
        table_name = get_table_name(environment)

        # 接続確認
        if not check_dynamodb_connection(dynamodb, table_name):
            return False

        # テーブル作成
        print_info(f"テーブル '{table_name}' を作成中...")

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
        print_info("テーブル作成完了を待機中...")
        table.wait_until_exists()

        print_success(f"テーブル '{table_name}' を作成しました")
        print_info(f"テーブル状態: {table.table_status}")

        return True

    except ClientError as e:
        error_code = e.response["Error"]["Code"]

        if error_code == "ResourceInUseException":
            print_error(f"テーブル '{table_name}' は既に存在します")
            print_info("--recreate オプションで再作成できます")
        else:
            print_error(f"テーブル作成エラー: {e}")

        return False

    except Exception as e:
        print_error(f"テーブル作成エラー: {e}")
        return False


def clear_table_data(environment: str, force: bool = False) -> bool:
    """
    DynamoDBテーブル内の全データを削除する

    Args:
        environment: 環境名（local/development/production）
        force: 確認なしで実行

    Returns:
        削除成功時True、失敗時False
    """
    try:
        dynamodb = get_dynamodb_client(environment)
        table_name = get_table_name(environment)

        # 接続確認
        if not check_dynamodb_connection(dynamodb, table_name):
            return False

        # テーブル存在確認
        if not table_exists(dynamodb, table_name):
            print_error(f"テーブル '{table_name}' が存在しません")
            return False

        # 確認プロンプト（forceオプションがない場合）
        if not force:
            print_warning(f"テーブル '{table_name}' 内の全データを削除します")

            if not confirm_action(f"本当に全データを削除しますか？"):
                print_info("データ削除をキャンセルしました")
                return False

        # 全データをスキャンして削除
        print_info(f"テーブル '{table_name}' のデータを削除中...")

        table = dynamodb.Table(table_name)

        # スキャンして全アイテムを取得
        response = table.scan()
        items = response.get("Items", [])

        # ページネーション対応
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))

        # 全アイテムを削除
        deleted_count = 0
        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})
                deleted_count += 1

        print_success(
            f"テーブル '{table_name}' から {deleted_count}件のデータを削除しました"
        )

        return True

    except ClientError as e:
        print_error(f"データ削除エラー: {e}")
        return False

    except Exception as e:
        print_error(f"データ削除エラー: {e}")
        return False


def delete_table(environment: str, force: bool = False) -> bool:
    """
    DynamoDBテーブルを削除する

    Args:
        environment: 環境名（local/development/production）
        force: 確認なしで実行

    Returns:
        削除成功時True、失敗時False
    """
    try:
        dynamodb = get_dynamodb_client(environment)
        table_name = get_table_name(environment)

        # 接続確認
        if not check_dynamodb_connection(dynamodb, table_name):
            return False

        # テーブル存在確認
        if not table_exists(dynamodb, table_name):
            print_info(f"テーブル '{table_name}' は存在しません")
            return True

        # 確認プロンプト（forceオプションがない場合）
        if not force:
            # development/production環境では特に警告を表示
            if environment in ["development", "production"]:
                print_warning(f"{environment}環境でテーブル削除を試みています")
                print_warning("この操作は危険です。全てのデータが失われます。")

            if not confirm_action(f"テーブル '{table_name}' を削除しますか？"):
                print_info("テーブル削除をキャンセルしました")
                return False

        # テーブル削除
        print_info(f"テーブル '{table_name}' を削除中...")

        table = dynamodb.Table(table_name)
        table.delete()
        table.wait_until_not_exists()

        print_success(f"テーブル '{table_name}' を削除しました")

        return True

    except ClientError as e:
        error_code = e.response["Error"]["Code"]

        if error_code == "ResourceNotFoundException":
            print_info(f"テーブル '{table_name}' は存在しません")
            return True
        else:
            print_error(f"テーブル削除エラー: {e}")
            return False

    except Exception as e:
        print_error(f"テーブル削除エラー: {e}")
        return False


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="DynamoDBテーブル作成スクリプト",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # local環境にテーブル作成
  python create_tables.py --environment local
  
  # development環境にテーブル作成（存在する場合はスキップ）
  python create_tables.py --environment development
  
  # local環境でテーブル再作成
  python create_tables.py --environment local --recreate
  
  # development環境でデータクリア
  python create_tables.py --environment development --clear-data
  
  # local環境でデータクリア（確認なし）
  python create_tables.py --environment local --clear-data --force
        """,
    )

    parser.add_argument(
        "--environment",
        choices=["local", "development", "production"],
        default="local",
        help="環境名（デフォルト: local）",
    )

    parser.add_argument(
        "--recreate",
        action="store_true",
        help="既存テーブルを削除してから再作成（local環境のみ）",
    )

    parser.add_argument(
        "--clear-data",
        action="store_true",
        help="テーブル内の全データを削除（local/development環境のみ）",
    )

    parser.add_argument("--force", action="store_true", help="確認なしで実行（危険）")

    args = parser.parse_args()

    # ヘッダー表示
    print_header("Janlog DynamoDBテーブル作成")

    # 環境名検証
    if not validate_environment(args.environment):
        sys.exit(1)

    # オプションの検証
    if args.recreate and args.environment != "local":
        print_error(f"--recreate オプションはlocal環境でのみ使用できます")
        print_info(
            f"{args.environment}環境では --clear-data オプションを使用してください"
        )
        sys.exit(1)

    if args.clear_data and args.environment == "production":
        print_error(f"--clear-data オプションはproduction環境では使用できません")
        sys.exit(1)

    if args.recreate and args.clear_data:
        print_error("--recreate と --clear-data は同時に指定できません")
        sys.exit(1)

    # 環境変数ファイル読み込み
    load_env_file(args.environment)

    # 環境情報表示
    print_environment_info(args.environment)
    print()

    # データクリアの場合
    if args.clear_data:
        print_info("データクリアモード")

        if not clear_table_data(args.environment, args.force):
            print_error("データクリアに失敗しました")
            sys.exit(1)

        print()
        print_success("データクリアが完了しました")
        sys.exit(0)

    # テーブル再作成の場合（local環境のみ）
    if args.recreate:
        print_info("テーブル再作成モード（local環境のみ）")

        # 既存テーブル削除
        if not delete_table(args.environment, args.force):
            print_error("テーブル削除に失敗しました")
            sys.exit(1)

        print()

    # テーブル作成
    dynamodb = get_dynamodb_client(args.environment)
    table_name = get_table_name(args.environment)

    # テーブル存在確認
    if table_exists(dynamodb, table_name):
        print_info(f"テーブル '{table_name}' は既に存在します")
        print_info("テーブル作成をスキップします")

        if args.environment == "local":
            print_info(
                "テーブルを再作成する場合は --recreate オプションを使用してください"
            )
        else:
            print_info(
                "データをクリアする場合は --clear-data オプションを使用してください"
            )

        sys.exit(0)

    if not create_table(args.environment):
        print_error("テーブル作成に失敗しました")
        sys.exit(1)

    print()
    print_success("テーブル作成が完了しました")

    # 次のステップを案内
    print()
    print_info("次のステップ:")
    print_info("  1. ユーザーseedを投入: python scripts/db/seed_users.py")
    print_info("  2. ルールセットseedを投入: python scripts/db/seed_rulesets.py")
    print_info("  または")
    print_info("  統合初期化: python scripts/db/init_db.py")


if __name__ == "__main__":
    main()
