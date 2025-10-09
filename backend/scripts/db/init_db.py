"""
データベース統合初期化スクリプト

このスクリプトは、データベースの初期化を統合的に実行します：
1. テーブル作成（オプション）
2. ユーザーseed投入（オプション）
3. ルールセットseed投入（オプション）

使用方法:
    # 全て実行（テーブル作成 + 全seed投入）
    python scripts/db/init_db.py --environment local

    # Seedのみ投入（テーブル作成スキップ）
    python scripts/db/init_db.py --environment local --seeds-only

    # 特定のseedのみ投入
    python scripts/db/init_db.py --environment local --only users
    python scripts/db/init_db.py --environment local --only rulesets

    # 既存データを上書きして投入
    python scripts/db/init_db.py --environment local --force

    # テーブルを再作成してから投入（local環境のみ）
    python scripts/db/init_db.py --environment local --recreate

    # テーブルデータをクリアしてから投入
    python scripts/db/init_db.py --environment local --clear-data

    # ルールセットをクリーンしてから投入
    python scripts/db/init_db.py --environment local --clean-rulesets
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.db.utils import (
    print_error,
    print_header,
    print_info,
    print_success,
    print_warning,
    validate_environment,
)


class InitResult:
    """初期化結果を保持するクラス"""

    def __init__(self):
        self.tables_created: Optional[bool] = None
        self.clear_data_mode: bool = False
        self.users_seeded: Optional[int] = None
        self.rulesets_seeded: Optional[int] = None
        self.errors: List[str] = []

    def has_errors(self) -> bool:
        """エラーがあるかどうか"""
        return len(self.errors) > 0

    def add_error(self, error: str):
        """エラーを追加"""
        self.errors.append(error)


def run_script(
    script_path: str, args: List[str], input_text: Optional[str] = None
) -> tuple[bool, str]:
    """
    スクリプトを実行する

    Args:
        script_path: スクリプトのパス
        args: コマンドライン引数
        input_text: 標準入力に送るテキスト（確認プロンプト用）

    Returns:
        (成功したかどうか, 出力メッセージ)
    """
    try:
        cmd = [sys.executable, script_path] + args
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            input=input_text,
        )

        if result.returncode == 0:
            return True, result.stdout
        else:
            return False, result.stderr or result.stdout

    except Exception as e:
        return False, str(e)


def create_tables(
    environment: str,
    recreate: bool = False,
    clear_data: bool = False,
    force: bool = False,
) -> bool:
    """
    テーブルを作成する

    Args:
        environment: 環境名
        recreate: テーブルを再作成するかどうか
        clear_data: データをクリアするかどうか
        force: 強制実行フラグ

    Returns:
        成功したかどうか
    """
    print()

    # clear_dataの場合はヘッダーを変更
    if clear_data:
        print_header("テーブルデータクリア")
    else:
        print_header("テーブル作成")

    script_path = str(Path(__file__).parent / "create_tables.py")
    args = ["--environment", environment]

    if recreate:
        args.append("--recreate")

    if clear_data:
        args.append("--clear-data")

    # recreateまたはclear_dataが指定されている場合は、自動的に--forceを追加
    # （サブプロセスでは確認プロンプトが使えないため）
    if force or recreate or clear_data:
        args.append("--force")

    success, output = run_script(script_path, args)

    if success:
        if clear_data:
            print_success("テーブルデータクリアが完了しました")
        else:
            print_success("テーブル作成が完了しました")
        return True
    else:
        if clear_data:
            print_error("テーブルデータクリアに失敗しました")
        else:
            print_error("テーブル作成に失敗しました")
        print_error(output)
        return False


def seed_users(environment: str, force: bool = False) -> Optional[int]:
    """
    ユーザーseedを投入する

    Args:
        environment: 環境名
        force: 強制上書きフラグ

    Returns:
        投入されたユーザー数（失敗時はNone）
    """
    print()
    print_header("ユーザーSeed投入")

    script_path = str(Path(__file__).parent / "seed_users.py")
    args = ["--environment", environment]

    if force:
        args.append("--force")

    success, output = run_script(script_path, args)

    if success:
        # 出力から投入数を抽出（簡易的な実装）
        # "✓ N件のユーザーを投入しました" というメッセージから抽出
        import re

        match = re.search(r"(\d+)件のユーザーを投入しました", output)
        count = int(match.group(1)) if match else 0

        print_success(f"{count}件のユーザーを投入しました")
        return count
    else:
        print_error("ユーザーseed投入に失敗しました")
        print_error(output)
        return None


def seed_rulesets(
    environment: str, force: bool = False, clean: bool = False
) -> Optional[int]:
    """
    ルールセットseedを投入する

    Args:
        environment: 環境名
        force: 強制上書きフラグ
        clean: クリーンフラグ

    Returns:
        投入されたルールセット数（失敗時はNone）
    """
    print()
    print_header("ルールセットSeed投入")

    script_path = str(Path(__file__).parent / "seed_rulesets.py")
    args = ["--environment", environment]

    if force:
        args.append("--force")

    if clean:
        args.append("--clean")

    # cleanオプションの場合、確認プロンプトに自動的に'y'を入力
    input_text = "y\n" if clean else None

    success, output = run_script(script_path, args, input_text)

    if success:
        # 出力から投入数を抽出
        import re

        match = re.search(r"(\d+)件のルールセットを投入しました", output)
        count = int(match.group(1)) if match else 0

        print_success(f"{count}件のルールセットを投入しました")
        return count
    else:
        print_error("ルールセットseed投入に失敗しました")
        print_error(output)
        return None


def init_database(
    environment: str,
    seeds_only: bool = False,
    only: Optional[str] = None,
    force: bool = False,
    recreate: bool = False,
    clear_data: bool = False,
    clean_rulesets: bool = False,
) -> InitResult:
    """
    データベースを初期化する

    Args:
        environment: 環境名
        seeds_only: Seedのみ投入（テーブル作成スキップ）
        only: 特定のseedのみ投入（"users", "rulesets", "tables"）
        force: 既存データを上書き
        recreate: テーブルを再作成（local環境のみ）
        clear_data: テーブルデータをクリア（local/development環境のみ）
        clean_rulesets: ルールセットをクリーンしてから投入

    Returns:
        初期化結果
    """
    result = InitResult()
    result.clear_data_mode = clear_data

    # onlyオプションの処理
    run_tables = True
    run_users = True
    run_rulesets = True

    if seeds_only:
        run_tables = False
        print_info("ℹ️  テーブル作成をスキップします")
    elif only:
        run_tables = only == "tables"
        run_users = only == "users"
        run_rulesets = only == "rulesets"

        if not run_tables:
            print_info("ℹ️  テーブル作成をスキップします")
        if not run_users:
            print_info("ℹ️  ユーザーseed投入をスキップします")
        if not run_rulesets:
            print_info("ℹ️  ルールセットseed投入をスキップします")

    # テーブル作成
    if run_tables:
        if not create_tables(environment, recreate, clear_data, force):
            if clear_data:
                result.add_error("テーブルデータクリアに失敗しました")
            else:
                result.add_error("テーブル作成に失敗しました")
            return result
        result.tables_created = True

    # ユーザーseed投入
    if run_users:
        users_count = seed_users(environment, force)
        if users_count is None:
            result.add_error("ユーザーseed投入に失敗しました")
            return result
        result.users_seeded = users_count

    # ルールセットseed投入
    if run_rulesets:
        rulesets_count = seed_rulesets(environment, force, clean_rulesets)
        if rulesets_count is None:
            result.add_error("ルールセットseed投入に失敗しました")
            return result
        result.rulesets_seeded = rulesets_count

    return result


def print_summary(result: InitResult):
    """
    結果サマリを表示する

    Args:
        result: 初期化結果
    """
    print()
    print_header("初期化完了")

    if result.tables_created is True:
        if result.clear_data_mode:
            print_success("✓ テーブルデータをクリアしました")
        else:
            print_success("✓ テーブルを作成しました")
    elif result.tables_created is False:
        print_warning("⚠️  テーブル作成をスキップしました")

    if result.users_seeded is not None:
        if result.users_seeded > 0:
            print_success(f"✓ {result.users_seeded}件のユーザーを投入しました")
        else:
            print_info("ℹ️  ユーザーは投入されませんでした（既存データをスキップ）")

    if result.rulesets_seeded is not None:
        if result.rulesets_seeded > 0:
            print_success(f"✓ {result.rulesets_seeded}件のルールセットを投入しました")
        else:
            print_info("ℹ️  ルールセットは投入されませんでした（既存データをスキップ）")


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="データベースを統合的に初期化します",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 全て実行（テーブル作成 + 全seed投入）
  python scripts/db/init_db.py --environment local

  # Seedのみ投入（テーブル作成スキップ）
  python scripts/db/init_db.py --environment local --seeds-only

  # 特定のseedのみ投入
  python scripts/db/init_db.py --environment local --only users
  python scripts/db/init_db.py --environment local --only rulesets

  # 既存データを上書きして投入
  python scripts/db/init_db.py --environment local --force

  # テーブルを再作成してから投入（local環境のみ）
  python scripts/db/init_db.py --environment local --recreate

  # テーブルデータをクリアしてから投入
  python scripts/db/init_db.py --environment local --clear-data

  # ルールセットをクリーンしてから投入
  python scripts/db/init_db.py --environment local --clean-rulesets
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
        "--seeds-only",
        action="store_true",
        help="Seedのみ投入（テーブル作成をスキップ）",
    )

    parser.add_argument(
        "--only",
        choices=["tables", "users", "rulesets"],
        help="特定の処理のみ実行",
    )

    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        help="既存データを上書きする",
    )

    parser.add_argument(
        "--recreate",
        action="store_true",
        help="テーブルを削除してから再作成する（local環境のみ）",
    )

    parser.add_argument(
        "--clear-data",
        action="store_true",
        help="テーブル内の全データを削除する（local/development環境のみ）",
    )

    parser.add_argument(
        "--clean-rulesets",
        action="store_true",
        help="既存のグローバルルールセットを削除してから投入する",
    )

    args = parser.parse_args()

    # ヘッダー表示
    print_header("データベース統合初期化")

    # 環境名の検証
    if not validate_environment(args.environment):
        sys.exit(1)

    # オプションの検証
    if args.seeds_only and args.only:
        print_error("--seeds-onlyと--onlyは同時に指定できません")
        sys.exit(1)

    try:
        # データベース初期化
        result = init_database(
            args.environment,
            args.seeds_only,
            args.only,
            args.force,
            args.recreate,
            args.clear_data,
            args.clean_rulesets,
        )

        # エラーチェック
        if result.has_errors():
            print()
            print_error("初期化中にエラーが発生しました:")
            for error in result.errors:
                print_error(f"  - {error}")
            sys.exit(1)

        # 結果サマリ
        print_summary(result)

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
