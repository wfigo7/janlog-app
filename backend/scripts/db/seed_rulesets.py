"""
ルールセットseed投入スクリプト

このスクリプトは、backend/seeds/rulesets.yamlからルールセットデータを読み込み、
デフォルトのグローバルルールセットを指定された環境のDynamoDBに投入します。

アプリケーションコード（app/）には依存せず、スクリプト内で完結します。

使用方法:
    python scripts/db/seed_rulesets.py --environment local
    python scripts/db/seed_rulesets.py --environment development --force
    python scripts/db/seed_rulesets.py --clean
"""

import argparse
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import yaml
from botocore.exceptions import ClientError

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.db.utils import (
    Colors,
    confirm_action,
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


def load_rulesets_from_yaml(file_path: Path) -> List[Dict]:
    """
    YAMLファイルからルールセットデータを読み込む

    Args:
        file_path: YAMLファイルのパス

    Returns:
        ルールセットデータのリスト

    Raises:
        FileNotFoundError: ファイルが見つからない場合
        yaml.YAMLError: YAML解析エラーの場合
        ValueError: データ構造が不正な場合
    """
    rulesets = load_seed_data_from_yaml(file_path, "rulesets", "ルールセット")

    # 各ルールセットデータの検証
    for i, ruleset in enumerate(rulesets):
        validate_ruleset_data(ruleset, i)

    return rulesets


def validate_ruleset_data(ruleset: Dict, index: int):
    """
    ルールセットデータを検証する

    Args:
        ruleset: ルールセットデータ
        index: リスト内のインデックス

    Raises:
        ValueError: データが不正な場合
    """
    # 必須フィールドの検証
    required_fields = [
        "name",
        "gameMode",
        "startingPoints",
        "basePoints",
        "uma",
        "oka",
    ]
    validate_required_fields(ruleset, required_fields, index, "ルールセット")

    # gameModeの検証
    valid_game_modes = ["three", "four"]
    validate_enum_field(ruleset, "gameMode", valid_game_modes, index, "ルールセット")

    # umaの検証
    if not isinstance(ruleset["uma"], list):
        raise ValueError(
            f"ルールセット[{index}]: 'uma'はリスト形式である必要があります"
        )

    expected_uma_length = 3 if ruleset["gameMode"] == "three" else 4
    if len(ruleset["uma"]) != expected_uma_length:
        raise ValueError(
            f"ルールセット[{index}]: '{ruleset['gameMode']}'麻雀のumaは"
            f"{expected_uma_length}要素である必要があります"
        )


def create_ruleset_item(ruleset_data: Dict) -> Dict:
    """
    ルールセットデータからDynamoDBアイテムを作成する

    Args:
        ruleset_data: YAMLから読み込んだルールセットデータ

    Returns:
        DynamoDBアイテム
    """
    # ルールセット名とゲームモードから決定的なIDを生成
    # これにより、同じルールセットは常に同じIDになる
    name_key = f"{ruleset_data['name']}-{ruleset_data['gameMode']}"
    ruleset_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, name_key))
    now = datetime.now(timezone.utc).isoformat()

    # 浮きウマ設定の取得
    use_floating_uma = ruleset_data.get("useFloatingUma", False)
    uma_matrix = ruleset_data.get("umaMatrix", None)

    item = {
        "PK": "GLOBAL",
        "SK": f"RULESET#{ruleset_id}",
        "entityType": "RULESET",
        "rulesetId": ruleset_id,
        "ruleName": ruleset_data["name"],
        "gameMode": ruleset_data["gameMode"],
        "startingPoints": ruleset_data["startingPoints"],
        "basePoints": ruleset_data["basePoints"],
        "useFloatingUma": use_floating_uma,
        "uma": ruleset_data["uma"],
        "umaMatrix": uma_matrix,
        "oka": ruleset_data["oka"],
        "useChips": ruleset_data.get("useChips", False),
        "memo": ruleset_data.get("description"),
        "basicRules": None,  # 将来実装予定
        "gameplayRules": None,  # 将来実装予定
        "additionalRules": None,  # 将来実装予定
        "isGlobal": ruleset_data.get(
            "isGlobal", True
        ),  # YAMLから読み込み、デフォルトはTrue
        "createdBy": "system",
        "createdAt": now,
        "updatedAt": now,
    }

    return item


def ruleset_exists(dynamodb, table_name: str, ruleset_id: str) -> bool:
    """
    ルールセットの存在を確認する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名
        ruleset_id: ルールセットID

    Returns:
        ルールセットが存在する場合True、存在しない場合False
    """
    return item_exists(dynamodb, table_name, "GLOBAL", f"RULESET#{ruleset_id}")


def clean_global_rulesets(dynamodb, table_name: str) -> int:
    """
    既存のグローバルルールセットを全て削除する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名

    Returns:
        削除されたルールセット数

    Raises:
        ClientError: DynamoDB操作エラー
    """
    try:
        table = dynamodb.Table(table_name)

        # グローバルルールセットを全て取得
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            ExpressionAttributeValues={":pk": "GLOBAL", ":sk_prefix": "RULESET#"},
        )

        items = response.get("Items", [])
        deleted_count = 0

        # 各ルールセットを削除
        for item in items:
            if item.get("entityType") == "RULESET":
                pk = item["PK"]
                sk = item["SK"]
                ruleset_name = item.get("ruleName", "不明")

                table.delete_item(Key={"PK": pk, "SK": sk})

                print_info(f"削除: {ruleset_name} ({sk})")
                deleted_count += 1

        return deleted_count

    except ClientError as e:
        print_error(f"グローバルルールセット削除エラー: {e}")
        raise


def seed_ruleset(
    dynamodb, table_name: str, ruleset_item: Dict, force: bool = False
) -> bool:
    """
    ルールセットを投入する

    Args:
        dynamodb: boto3 DynamoDB resource
        table_name: テーブル名
        ruleset_item: ルールセットアイテム
        force: 既存ルールセットを上書きするかどうか

    Returns:
        投入された場合True、スキップされた場合False

    Raises:
        ClientError: DynamoDB操作エラー
    """
    ruleset_id = ruleset_item["rulesetId"]
    ruleset_name = ruleset_item["ruleName"]
    game_mode = ruleset_item["gameMode"]

    # ルールセットの存在確認
    if ruleset_exists(dynamodb, table_name, ruleset_id):
        if not force:
            print_warning(
                f"ルールセットが既に存在します: {ruleset_name} ({game_mode}麻雀) - スキップ"
            )
            return False
        else:
            print_info(f"既存ルールセットを上書きします: {ruleset_name}")

    # DynamoDBに投入
    try:
        table = dynamodb.Table(table_name)
        table.put_item(Item=ruleset_item)

        print_success(
            f"ルールセット投入完了: {ruleset_name} ({game_mode}麻雀) - "
            f"開始点: {ruleset_item['startingPoints']}, "
            f"ウマ: {ruleset_item['uma']}, オカ: {ruleset_item['oka']}"
        )

        return True

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "ResourceNotFoundException":
            print_error(f"テーブルが存在しません: {table_name}")
            print_info("テーブルを作成してください: python scripts/db/create_tables.py")
            raise
        print_error(f"ルールセット投入エラー ({ruleset_name}): {e}")
        raise


def seed_rulesets(
    environment: str,
    force: bool = False,
    clean: bool = False,
    file_path: Optional[Path] = None,
) -> int:
    """
    ルールセットseedを投入する

    Args:
        environment: 環境名（local/development/production）
        force: 既存ルールセットを上書きするかどうか
        clean: 既存のグローバルルールセットを全て削除してから投入するかどうか
        file_path: seedファイルのパス（Noneの場合はデフォルト）

    Returns:
        投入されたルールセット数

    Raises:
        Exception: 処理中にエラーが発生した場合
    """
    # 環境セットアップ
    dynamodb, table_name = setup_seed_environment(environment)

    # cleanオプションが指定されている場合、既存のグローバルルールセットを削除
    if clean:
        print()
        print_warning("既存のグローバルルールセットを全て削除します")
        print_info("ユーザー個人のルールセット（PK=USER#*）は削除されません")

        if not confirm_action("本当に削除しますか？", default=False):
            print_warning("処理を中断しました")
            return 0

        print()
        deleted_count = clean_global_rulesets(dynamodb, table_name)
        print_success(f"{deleted_count}件のグローバルルールセットを削除しました")
        print()

    # seedファイルのパス
    file_path = get_seed_file_path(file_path, "rulesets.yaml")
    print_info(f"Seedファイル: {file_path}")

    # ルールセットデータの読み込み
    try:
        rulesets_data = load_rulesets_from_yaml(file_path)
        print_info(f"読み込んだルールセット数: {len(rulesets_data)}")
    except Exception as e:
        print_error(f"Seedファイル読み込みエラー: {e}")
        raise

    # 各ルールセットを投入
    # cleanオプションが指定されている場合は、既に削除済みなので全て投入される
    # forceオプションが指定されている場合は、既存ルールセットを上書き
    # どちらも指定されていない場合は、既存ルールセットをスキップ
    seeded_count = 0

    for ruleset_data in rulesets_data:
        try:
            # DynamoDBアイテムを作成
            ruleset_item = create_ruleset_item(ruleset_data)

            # cleanオプションが指定されている場合は、強制的に投入
            result = seed_ruleset(
                dynamodb, table_name, ruleset_item, force=(force or clean)
            )
            if result:
                seeded_count += 1
        except Exception as e:
            print_error(f"ルールセット投入中にエラーが発生しました: {e}")
            # エラーが発生しても続行する
            continue

    return seeded_count


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="ルールセットseedをDynamoDBに投入します",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # local環境にルールセットを投入
  python scripts/db/seed_rulesets.py --environment local

  # development環境に既存ルールセットを上書きして投入
  python scripts/db/seed_rulesets.py --environment development --force

  # 既存のグローバルルールセットを全て削除してから投入
  python scripts/db/seed_rulesets.py --clean

  # カスタムseedファイルを使用
  python scripts/db/seed_rulesets.py --file seeds/custom_rulesets.yaml
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
        help="既存ルールセットを上書きする",
    )

    parser.add_argument(
        "--clean",
        "-c",
        action="store_true",
        help="既存のグローバルルールセット（PK=GLOBAL）を全て削除してから投入する",
    )

    parser.add_argument(
        "--file",
        type=Path,
        help="seedファイルのパス（デフォルト: seeds/rulesets.yaml）",
    )

    args = parser.parse_args()

    # ヘッダー表示
    print_header("ルールセットSeed投入")

    # 環境名の検証
    if not validate_environment(args.environment):
        sys.exit(1)

    try:
        # ルールセットseed投入
        seeded_count = seed_rulesets(
            args.environment, args.force, args.clean, args.file
        )

        # 結果サマリ
        print()
        print_header("投入完了")
        print_success(format_item_count(seeded_count, "ルールセットを投入しました"))

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
