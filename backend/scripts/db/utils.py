"""
データベーススクリプト共通ユーティリティ

このモジュールは、データベース初期化・管理スクリプトで使用される
共通機能を提供します。
"""

import os
import sys
from pathlib import Path
from typing import Optional, Any
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError


# 色付き出力用のANSIエスケープコード
class Colors:
    """ターミナル出力用の色定義"""

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def get_project_root() -> Path:
    """
    プロジェクトルートディレクトリを取得する

    Returns:
        プロジェクトルートのPathオブジェクト（backendディレクトリ）
    """
    # このファイルは backend/scripts/db/utils.py にある
    # backendディレクトリは2階層上
    current_file = Path(__file__).resolve()
    return current_file.parent.parent.parent


def load_env_file(environment: str) -> bool:
    """
    環境変数ファイルを読み込む

    Args:
        environment: 環境名（local/development/production）

    Returns:
        読み込み成功時True、失敗時False
    """
    project_root = get_project_root()
    env_file = project_root / f".env.{environment}"

    if env_file.exists():
        # override=Trueで既存の環境変数を上書き
        load_dotenv(env_file, override=True)
        print_info(f"環境変数ファイルを読み込みました: {env_file}")
        return True
    else:
        print_warning(f"環境変数ファイルが見つかりません: {env_file}")
        print_warning("デフォルト値を使用します")
        return False


def get_dynamodb_client(environment: str):
    """
    環境に応じたDynamoDBクライアントを取得する

    Args:
        environment: 環境名（local/development/production）

    Returns:
        boto3 DynamoDB resource

    Raises:
        ValueError: 無効な環境名が指定された場合
    """
    if environment not in ["local", "development", "production"]:
        raise ValueError(f"無効な環境名: {environment}")

    # 環境変数を取得
    region_name = os.getenv("AWS_REGION", "ap-northeast-1")

    if environment == "local":
        # local環境: DynamoDB Local
        endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")

        dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url=endpoint_url,
            region_name=region_name,
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy",
        )

        print_info(f"DynamoDB Local接続: {endpoint_url}")

    else:
        # development/production環境: AWS DynamoDB
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=region_name,
        )

        print_info(f"AWS DynamoDB接続: {region_name}")

    return dynamodb


def get_table_name(environment: str) -> str:
    """
    環境に応じたテーブル名を取得する

    Args:
        environment: 環境名（local/development/production）

    Returns:
        テーブル名
    """
    # 環境変数が設定されている場合はそれを使用
    # 設定されていない場合は janlog-table-{environment} をデフォルトとする
    table_name = os.getenv("DYNAMODB_TABLE_NAME")

    if table_name:
        return table_name
    else:
        # デフォルトのテーブル名を返す
        return f"janlog-table-{environment}"


def confirm_action(message: str, default: bool = False) -> bool:
    """
    ユーザーに確認を求める

    Args:
        message: 確認メッセージ
        default: デフォルト値（Enterキーのみの場合）

    Returns:
        ユーザーの選択（True/False）
    """
    default_str = "Y/n" if default else "y/N"
    prompt = f"{Colors.YELLOW}⚠️  {message} [{default_str}]: {Colors.RESET}"

    try:
        response = input(prompt).strip().lower()

        if not response:
            return default

        return response in ["y", "yes"]

    except (KeyboardInterrupt, EOFError):
        print()
        return False


def print_success(message: str):
    """
    成功メッセージを表示する

    Args:
        message: メッセージ
    """
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")


def print_error(message: str):
    """
    エラーメッセージを表示する

    Args:
        message: メッセージ
    """
    print(f"{Colors.RED}❌ {message}{Colors.RESET}", file=sys.stderr)


def print_warning(message: str):
    """
    警告メッセージを表示する

    Args:
        message: メッセージ
    """
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")


def print_info(message: str):
    """
    情報メッセージを表示する

    Args:
        message: メッセージ
    """
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.RESET}")


def print_header(message: str):
    """
    ヘッダーメッセージを表示する

    Args:
        message: メッセージ
    """
    print(f"\n{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{message}{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}\n")


def check_dynamodb_connection(dynamodb, table_name: str) -> bool:
    """
    DynamoDB接続を確認する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名

    Returns:
        接続成功時True、失敗時False
    """
    try:
        # テーブル一覧を取得して接続確認
        client = dynamodb.meta.client
        client.list_tables()
        return True

    except ClientError as e:
        error_code = e.response["Error"]["Code"]

        if error_code == "ResourceNotFoundException":
            # テーブルが存在しないだけなら接続は成功
            return True
        else:
            print_error(f"DynamoDB接続エラー: {e}")
            return False

    except Exception as e:
        print_error(f"DynamoDB接続エラー: {e}")

        # local環境の場合、DynamoDB Localの起動を促す
        endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL")
        if endpoint_url and "localhost" in endpoint_url:
            print_info("DynamoDB Localが起動していない可能性があります")
            print_info("以下のコマンドで起動してください:")
            print_info("  make start-db")
            print_info("  または")
            print_info("  docker-compose -f docker/dynamodb/docker-compose.yml up -d")
        else:
            print_info("AWS認証情報を確認してください:")
            print_info("  aws sts get-caller-identity")

        return False


def table_exists(dynamodb, table_name: str) -> bool:
    """
    テーブルの存在を確認する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名

    Returns:
        テーブルが存在する場合True、存在しない場合False
    """
    try:
        table = dynamodb.Table(table_name)
        table.load()
        return True

    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            return False
        else:
            raise


def format_item_count(count: int, item_type: str) -> str:
    """
    アイテム数を整形して表示する

    Args:
        count: アイテム数
        item_type: アイテムタイプ（例: "ユーザー", "ルールセット"）

    Returns:
        整形された文字列
    """
    return f"{count}件の{item_type}"


def validate_environment(environment: str) -> bool:
    """
    環境名を検証する

    Args:
        environment: 環境名

    Returns:
        有効な環境名の場合True、無効な場合False
    """
    valid_environments = ["local", "development", "production"]

    if environment not in valid_environments:
        print_error(f"無効な環境名: {environment}")
        print_info(f"有効な環境名: {', '.join(valid_environments)}")
        return False

    return True


def print_environment_info(environment: str):
    """
    環境情報を表示する

    Args:
        environment: 環境名
    """
    table_name = get_table_name(environment)
    region = os.getenv("AWS_REGION", "ap-northeast-1")

    print_info(f"環境: {environment}")
    print_info(f"リージョン: {region}")
    print_info(f"テーブル名: {table_name}")

    if environment == "local":
        endpoint_url = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
        print_info(f"DynamoDB Endpoint: {endpoint_url}")
