"""
ユーザーseed投入スクリプト

このスクリプトは、backend/seeds/users.yamlからユーザーデータを読み込み、
指定された環境のDynamoDBにユーザーを投入します。

使用方法:
    python scripts/db/seed_users.py --environment local
    python scripts/db/seed_users.py --environment development --force
    python scripts/db/seed_users.py --file seeds/custom_users.yaml
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import yaml
from botocore.exceptions import ClientError

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.db.utils import (
    Colors,
    format_item_count,
    print_error,
    print_header,
    print_info,
    print_success,
    print_warning,
    validate_environment,
)

from scripts.db.seed_utils import (
    load_seed_data_from_yaml,
    validate_required_fields,
    validate_enum_field,
    item_exists,
    setup_seed_environment,
    get_seed_file_path,
)


def load_users_from_yaml(file_path: Path) -> List[Dict]:
    """
    YAMLファイルからユーザーデータを読み込む

    Args:
        file_path: YAMLファイルのパス

    Returns:
        ユーザーデータのリスト

    Raises:
        FileNotFoundError: ファイルが見つからない場合
        yaml.YAMLError: YAML解析エラーの場合
        ValueError: データ構造が不正な場合
    """
    users = load_seed_data_from_yaml(file_path, "users", "ユーザー")

    # 各ユーザーデータの検証
    for i, user in enumerate(users):
        validate_user_data(user, i)

    return users


def validate_user_data(user: Dict, index: int):
    """
    ユーザーデータを検証する

    Args:
        user: ユーザーデータ
        index: リスト内のインデックス

    Raises:
        ValueError: データが不正な場合
    """
    # 必須フィールドの検証
    required_fields = ["userId", "email", "displayName", "role"]
    validate_required_fields(user, required_fields, index, "ユーザー")

    # roleの検証
    valid_roles = ["user", "admin"]
    validate_enum_field(user, "role", valid_roles, index, "ユーザー")


def user_exists(dynamodb, table_name: str, user_id: str) -> bool:
    """
    ユーザーの存在を確認する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名
        user_id: ユーザーID

    Returns:
        ユーザーが存在する場合True、存在しない場合False
    """
    return item_exists(dynamodb, table_name, f"USER#{user_id}", "PROFILE")


def seed_user(
    dynamodb, table_name: str, user_data: Dict, force: bool = False
) -> Optional[str]:
    """
    ユーザーを投入する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名
        user_data: ユーザーデータ
        force: 既存ユーザーを上書きするかどうか

    Returns:
        成功時はユーザーID、スキップ時はNone

    Raises:
        ClientError: DynamoDB操作エラー
    """
    user_id = user_data["userId"]

    # ユーザーの存在確認
    if user_exists(dynamodb, table_name, user_id):
        if not force:
            print_warning(
                f"ユーザーが既に存在します: {user_id} ({user_data['email']}) - スキップ"
            )
            return None
        else:
            print_info(f"既存ユーザーを上書きします: {user_id}")

    # DynamoDBアイテムの構築
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "PK": f"USER#{user_id}",
        "SK": "PROFILE",
        "entityType": "PROFILE",
        "userId": user_id,
        "email": user_data["email"],
        "displayName": user_data["displayName"],
        "role": user_data["role"],
        "createdAt": now,
        "lastLoginAt": now,
    }

    # DynamoDBに投入
    try:
        table = dynamodb.Table(table_name)
        table.put_item(Item=item)

        print_success(
            f"ユーザー投入完了: {user_id} ({user_data['email']}) - {user_data['displayName']}"
        )

        return user_id

    except ClientError as e:
        print_error(f"ユーザー投入エラー ({user_id}): {e}")
        raise


def seed_users(
    environment: str, force: bool = False, file_path: Optional[Path] = None
) -> int:
    """
    ユーザーseedを投入する

    Args:
        environment: 環境名（local/development/production）
        force: 既存ユーザーを上書きするかどうか
        file_path: seedファイルのパス（Noneの場合はデフォルト）

    Returns:
        投入されたユーザー数

    Raises:
        Exception: 処理中にエラーが発生した場合
    """
    # 環境セットアップ
    dynamodb, table_name = setup_seed_environment(environment)

    # seedファイルのパス
    file_path = get_seed_file_path(file_path, "users.yaml")
    print_info(f"Seedファイル: {file_path}")

    # ユーザーデータの読み込み
    try:
        users = load_users_from_yaml(file_path)
        print_info(f"読み込んだユーザー数: {len(users)}")
    except Exception as e:
        print_error(f"Seedファイル読み込みエラー: {e}")
        raise

    # ユーザーの投入
    seeded_count = 0

    for user_data in users:
        try:
            result = seed_user(dynamodb, table_name, user_data, force)
            if result:
                seeded_count += 1
        except Exception as e:
            print_error(f"ユーザー投入中にエラーが発生しました: {e}")
            # エラーが発生しても続行する
            continue

    return seeded_count


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="ユーザーseedをDynamoDBに投入します",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # local環境にユーザーを投入
  python scripts/db/seed_users.py --environment local

  # development環境に既存ユーザーを上書きして投入
  python scripts/db/seed_users.py --environment development --force

  # カスタムseedファイルを使用
  python scripts/db/seed_users.py --file seeds/custom_users.yaml
        """,
    )

    parser.add_argument(
        "--environment",
        "-e",
        choices=["local", "development", "production"],
        default="local",
        help="環境名（デフォルト: local）",
    )

    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        help="既存ユーザーを上書きする",
    )

    parser.add_argument(
        "--file",
        type=Path,
        help="seedファイルのパス（デフォルト: seeds/users.yaml）",
    )

    args = parser.parse_args()

    # ヘッダー表示
    print_header("ユーザーSeed投入")

    # 環境名の検証
    if not validate_environment(args.environment):
        sys.exit(1)

    try:
        # ユーザーseed投入
        seeded_count = seed_users(args.environment, args.force, args.file)

        # 結果サマリ
        print()
        print_header("投入完了")
        print_success(format_item_count(seeded_count, "ユーザーを投入しました"))

        sys.exit(0)

    except KeyboardInterrupt:
        print()
        print_warning("処理が中断されました")
        sys.exit(130)

    except Exception as e:
        print()
        print_error(f"エラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
