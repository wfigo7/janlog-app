"""
バージョン管理モジュール

pyproject.tomlからバージョン情報を読み込みます。
"""

import tomllib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def get_version() -> str:
    """
    pyproject.tomlからバージョンを読み込む

    Returns:
        str: バージョン文字列（例: "0.1.0"）。読み込みに失敗した場合は"unknown"を返す。
    """
    try:
        pyproject_path = Path(__file__).parent.parent / "pyproject.toml"

        if not pyproject_path.exists():
            logger.error(f"pyproject.toml not found at {pyproject_path}")
            return "unknown"

        with open(pyproject_path, "rb") as f:
            pyproject = tomllib.load(f)

        version = pyproject.get("project", {}).get("version")

        if not version:
            logger.error("Version not found in pyproject.toml")
            return "unknown"

        return version

    except Exception as e:
        logger.error(f"Failed to read version from pyproject.toml: {e}")
        return "unknown"


# モジュールレベルでバージョンを読み込み
VERSION: str = get_version()
