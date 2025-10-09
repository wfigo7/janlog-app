"""
Seed投入スクリプト共通ユーティリティ

このモジュールは、各種seed投入スクリプトで使用される
共通機能を提供します。
"""

from pathlib import Path
from typing import Dict, List

import yaml


def load_seed_data_from_yaml(
    file_path: Path, data_key: str, item_name: str = "データ"
) -> List[Dict]:
    """
    YAMLファイルからseedデータを読み込む（汎用版）

    Args:
        file_path: YAMLファイルのパス
        data_key: データのキー名（例: "users", "rulesets"）
        item_name: アイテムの名前（エラーメッセージ用、例: "ユーザー", "ルールセット"）

    Returns:
        seedデータのリスト

    Raises:
        FileNotFoundError: ファイルが見つからない場合
        yaml.YAMLError: YAML解析エラーの場合
        ValueError: データ構造が不正な場合
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Seedファイルが見つかりません: {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        if not data or data_key not in data:
            raise ValueError(f"YAMLファイルに'{data_key}'キーが見つかりません")

        items = data[data_key]

        if not isinstance(items, list):
            raise ValueError(f"'{data_key}'はリスト形式である必要があります")

        return items

    except yaml.YAMLError as e:
        raise yaml.YAMLError(f"YAML解析エラー: {e}")


def validate_required_fields(
    data: Dict, required_fields: List[str], index: int, item_name: str = "データ"
):
    """
    必須フィールドを検証する

    Args:
        data: 検証するデータ
        required_fields: 必須フィールドのリスト
        index: リスト内のインデックス
        item_name: アイテムの名前（エラーメッセージ用）

    Raises:
        ValueError: 必須フィールドが不足している場合
    """
    for field in required_fields:
        if field not in data:
            raise ValueError(
                f"{item_name}[{index}]: 必須フィールド'{field}'が見つかりません"
            )


def validate_enum_field(
    data: Dict,
    field_name: str,
    valid_values: List[str],
    index: int,
    item_name: str = "データ",
):
    """
    列挙型フィールドを検証する

    Args:
        data: 検証するデータ
        field_name: フィールド名
        valid_values: 有効な値のリスト
        index: リスト内のインデックス
        item_name: アイテムの名前（エラーメッセージ用）

    Raises:
        ValueError: 無効な値の場合
    """
    if data[field_name] not in valid_values:
        raise ValueError(
            f"{item_name}[{index}]: 無効な{field_name} '{data[field_name]}' "
            f"(有効な値: {', '.join(valid_values)})"
        )


def item_exists(dynamodb, table_name: str, pk: str, sk: str) -> bool:
    """
    DynamoDBアイテムの存在を確認する（汎用版）

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名
        pk: パーティションキー
        sk: ソートキー

    Returns:
        アイテムが存在する場合True、存在しない場合False
    """
    try:
        table = dynamodb.Table(table_name)
        response = table.get_item(Key={"PK": pk, "SK": sk})

        return "Item" in response

    except Exception:
        # エラーが発生した場合は存在しないとみなす
        return False


def setup_seed_environment(environment: str):
    """
    Seed投入環境をセットアップする

    Args:
        environment: 環境名（local/development/production）

    Returns:
        (dynamodb, table_name) のタプル

    Raises:
        Exception: セットアップに失敗した場合
    """
    from scripts.db.utils import (
        check_dynamodb_connection,
        get_dynamodb_client,
        get_table_name,
        load_env_file,
        print_environment_info,
        table_exists,
        print_error,
        print_info,
    )

    # 環境変数ファイルの読み込み
    load_env_file(environment)

    # 環境情報の表示
    print_environment_info(environment)

    # DynamoDBクライアントの取得
    dynamodb = get_dynamodb_client(environment)
    table_name = get_table_name(environment)

    # 接続確認
    if not check_dynamodb_connection(dynamodb, table_name):
        raise Exception("DynamoDB接続に失敗しました")

    # テーブルの存在確認
    if not table_exists(dynamodb, table_name):
        print_error(f"テーブルが存在しません: {table_name}")
        print_info("テーブルを作成してください:")
        print_info("  python scripts/db/create_tables.py --environment " + environment)
        raise Exception("テーブルが存在しません")

    return dynamodb, table_name


def get_seed_file_path(
    file_path: Path = None, default_filename: str = "data.yaml"
) -> Path:
    """
    Seedファイルのパスを取得する

    Args:
        file_path: 指定されたファイルパス（Noneの場合はデフォルト）
        default_filename: デフォルトのファイル名

    Returns:
        Seedファイルのパス
    """
    if file_path is None:
        from scripts.db.utils import get_project_root

        project_root = get_project_root()
        file_path = project_root / "seeds" / default_filename

    return file_path
