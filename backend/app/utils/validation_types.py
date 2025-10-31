"""
バリデーション型定義とエラーコード

フロントエンドの validation.ts と同等の機能を提供します。
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ValidationSeverity(str, Enum):
    """バリデーションエラーの重要度"""
    ERROR = "error"
    WARNING = "warning"


class ValidationErrorCode(str, Enum):
    """バリデーションエラーコード"""
    
    # E-00系: 基本形式エラー
    INVALID_DATE_FORMAT = "E-00-01"
    FUTURE_DATE = "E-00-02"
    TOO_OLD_DATE = "E-00-03"
    INVALID_RANK = "E-00-04"
    INVALID_FINAL_POINTS_RANGE = "E-00-05"
    INVALID_FINAL_POINTS_PRECISION = "E-00-06"
    INVALID_RAW_SCORE_RANGE = "E-00-07"
    INVALID_RAW_SCORE_UNIT = "E-00-08"
    INVALID_CHIP_COUNT = "E-00-09"
    INVALID_FLOATING_COUNT_RANGE = "E-00-10"
    
    # E-01系: 入力方式とルールの整合性エラー
    FLOATING_COUNT_WITH_FIXED_UMA = "E-01-01"
    MISSING_FLOATING_COUNT = "E-01-02"
    MISSING_FINAL_POINTS = "E-01-03"
    MISSING_RAW_SCORE = "E-01-04"
    
    # E-10系: 浮き人数の存在可能性エラー
    IMPOSSIBLE_ZERO_FLOATING = "E-10-01"
    IMPOSSIBLE_ALL_FLOATING = "E-10-02"
    INVALID_FLOATING_COUNT_RANGE_FOR_RULE = "E-10-03"
    
    # E-20系: 素点と浮き人数の整合性エラー
    FLOATING_SCORE_WITH_ZERO_COUNT = "E-20-01"
    SINKING_SCORE_WITH_ALL_FLOATING = "E-20-02"
    INCONSISTENT_FLOATING_COUNT_WITH_EQUAL_POINTS = "E-20-03"
    INCONSISTENT_FLOATING_COUNT_WITH_LOWER_START = "E-20-04"
    
    # E-30系: 順位と素点の関係エラー
    TOP_RANK_SINKING_WITH_FLOATING = "E-30-01"
    LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING = "E-30-02"
    LAST_RANK_FLOATING_WITH_LOWER_START = "E-30-03"
    ALL_FLOATING_WITH_SINKING_SCORE = "E-30-04"
    ALL_SINKING_WITH_FLOATING_SCORE = "E-30-05"
    
    # E-40系: 最終ポイントとルールの整合性エラー
    UMA_NOT_DEFINED = "E-40-01"
    CALCULATED_POINTS_OUT_OF_RANGE = "E-40-02"
    CALCULATED_POINTS_PRECISION_ERROR = "E-40-03"
    
    # E-43系: トップの最終ポイント下限エラー
    TOP_POINTS_BELOW_MINIMUM = "E-43-01"
    
    # E-44系: ラスの最終ポイント上限エラー
    LAST_POINTS_ABOVE_MAXIMUM = "E-44-01"


class ValidationError(BaseModel):
    """バリデーションエラー"""
    field: str
    code: ValidationErrorCode
    message: str
    severity: ValidationSeverity
    hint: Optional[str] = None


class ValidationResult(BaseModel):
    """バリデーション結果"""
    is_valid: bool
    errors: List[ValidationError]


# エラーメッセージとヒントのマッピング
ERROR_MESSAGES: Dict[ValidationErrorCode, Dict[str, str]] = {
    # E-00系: 基本形式エラー
    ValidationErrorCode.INVALID_DATE_FORMAT: {
        "message": "日付の形式が正しくありません",
        "hint": "YYYY-MM-DD形式で入力してください",
    },
    ValidationErrorCode.FUTURE_DATE: {
        "message": "未来の日付は選択できません",
        "hint": "今日以前の日付を選択してください",
    },
    ValidationErrorCode.TOO_OLD_DATE: {
        "message": "5年以上前の日付は選択できません",
        "hint": "直近5年以内の日付を選択してください",
    },
    ValidationErrorCode.INVALID_RANK: {
        "message": "順位が範囲外です",
        "hint": "1から{maxRank}の範囲で入力してください",
    },
    ValidationErrorCode.INVALID_FINAL_POINTS_RANGE: {
        "message": "最終ポイントが範囲外です",
        "hint": "-999.9から999.9の範囲で入力してください",
    },
    ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION: {
        "message": "最終ポイントの精度が正しくありません",
        "hint": "小数点第1位までで入力してください",
    },
    ValidationErrorCode.INVALID_RAW_SCORE_RANGE: {
        "message": "素点が範囲外です",
        "hint": "-999900から999900の範囲で入力してください",
    },
    ValidationErrorCode.INVALID_RAW_SCORE_UNIT: {
        "message": "素点の単位が正しくありません",
        "hint": "下2桁は00である必要があります（100点単位）",
    },
    ValidationErrorCode.INVALID_CHIP_COUNT: {
        "message": "チップ数が正しくありません",
        "hint": "0以上の整数を入力してください",
    },
    ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE: {
        "message": "浮き人数が範囲外です",
        "hint": "0から{maxFloating}の範囲で入力してください",
    },
    
    # E-01系: 入力方式とルールの整合性エラー
    ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA: {
        "message": "固定ウマルールでは浮き人数は不要です",
        "hint": "浮き人数の入力を削除してください",
    },
    ValidationErrorCode.MISSING_FLOATING_COUNT: {
        "message": "浮きウマルールでは浮き人数が必須です",
        "hint": "浮き人数を入力してください",
    },
    ValidationErrorCode.MISSING_FINAL_POINTS: {
        "message": "順位+最終ポイント方式では最終ポイントが必要です",
        "hint": "最終ポイントを入力してください",
    },
    ValidationErrorCode.MISSING_RAW_SCORE: {
        "message": "順位+素点方式では素点が必要です",
        "hint": "素点を入力してください",
    },
    
    # E-10系: 浮き人数の存在可能性エラー
    ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING: {
        "message": "開始点と基準点が同じ場合、浮き人数0は存在しません",
        "hint": "浮き人数を1以上に修正してください",
    },
    ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING: {
        "message": "開始点が基準点より小さい場合、全員浮きは不可能です",
        "hint": "浮き人数を{maxFloating}未満に修正してください",
    },
    ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE_FOR_RULE: {
        "message": "このルールでは取り得ない浮き人数です",
        "hint": "浮き人数を確認してください",
    },
    
    # E-20系: 素点と浮き人数の整合性エラー
    ValidationErrorCode.FLOATING_SCORE_WITH_ZERO_COUNT: {
        "message": "自分が浮いているのに浮き人数が0人になっています",
        "hint": "浮き人数を1人以上に修正してください",
    },
    ValidationErrorCode.SINKING_SCORE_WITH_ALL_FLOATING: {
        "message": "自分が沈んでいるのに全員浮きになっています",
        "hint": "浮き人数または素点を確認してください",
    },
    ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_EQUAL_POINTS: {
        "message": "開始点と基準点が同じ場合、浮き人数は1以上である必要があります",
        "hint": "浮き人数を1以上に修正してください",
    },
    ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_LOWER_START: {
        "message": "開始点が基準点より小さい場合、全員浮きは不可能です",
        "hint": "浮き人数または素点を確認してください",
    },
    
    # E-30系: 順位と素点の関係エラー
    ValidationErrorCode.TOP_RANK_SINKING_WITH_FLOATING: {
        "message": "1位なのに素点が基準点未満です（浮き人数が2人以上の場合、1位は必ず浮きます）",
        "hint": "素点または順位を確認してください",
    },
    ValidationErrorCode.LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING: {
        "message": "最下位なのに素点が基準点以上です（浮き人数が少ない場合、最下位は必ず沈みます）",
        "hint": "素点または順位を確認してください",
    },
    ValidationErrorCode.LAST_RANK_FLOATING_WITH_LOWER_START: {
        "message": "開始点が基準点より小さい場合、最下位が浮くことはありません",
        "hint": "素点または順位を確認してください",
    },
    ValidationErrorCode.ALL_FLOATING_WITH_SINKING_SCORE: {
        "message": "全員浮きなのに自分が沈んでいます",
        "hint": "浮き人数または素点を確認してください",
    },
    ValidationErrorCode.ALL_SINKING_WITH_FLOATING_SCORE: {
        "message": "全員沈みなのに自分が浮いています",
        "hint": "浮き人数または素点を確認してください",
    },
    
    # E-40系: 最終ポイントとルールの整合性エラー
    ValidationErrorCode.UMA_NOT_DEFINED: {
        "message": "選択されたルールに該当するウマが定義されていません",
        "hint": "ルールまたは浮き人数を確認してください",
    },
    ValidationErrorCode.CALCULATED_POINTS_OUT_OF_RANGE: {
        "message": "計算された最終ポイントが範囲外です",
        "hint": "素点または順位を確認してください",
    },
    ValidationErrorCode.CALCULATED_POINTS_PRECISION_ERROR: {
        "message": "計算された最終ポイントの精度が正しくありません",
        "hint": "システムエラーの可能性があります",
    },
    
    # E-43系: トップの最終ポイント下限エラー
    ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM: {
        "message": "1位の最終ポイントがルール上の最小値を下回っています",
        "hint": "最終ポイントは{minPoints}以上である必要があります",
    },
    
    # E-44系: ラスの最終ポイント上限エラー
    ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM: {
        "message": "最下位の最終ポイントがルール上の最大値を上回っています",
        "hint": "最終ポイントは{maxPoints}以下である必要があります",
    },
}


def format_error_message(message: str, params: Dict[str, Any]) -> str:
    """
    エラーメッセージのプレースホルダーを置換する
    
    Args:
        message: プレースホルダーを含むメッセージ
        params: 置換する値の辞書
    
    Returns:
        置換後のメッセージ
    """
    formatted = message
    for key, value in params.items():
        formatted = formatted.replace(f"{{{key}}}", str(value))
    return formatted
