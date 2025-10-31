"""
単一項目バリデーションのテスト
"""

import pytest
from datetime import datetime, timedelta

from app.utils.match_validator import MatchValidator
from app.utils.validation_types import ValidationErrorCode


class TestDateValidation:
    """日付バリデーションのテスト"""

    def test_today_is_valid(self):
        """今日の日付は有効"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(today)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_yesterday_is_valid(self):
        """昨日の日付は有効"""
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(yesterday)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_one_year_ago_is_valid(self):
        """1年前の日付は有効"""
        one_year_ago = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(one_year_ago)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_four_years_ago_is_valid(self):
        """4年前の日付は有効"""
        four_years_ago = (datetime.now() - timedelta(days=365 * 4)).strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(four_years_ago)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_future_date_is_error(self):
        """未来の日付はエラー"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(tomorrow)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.FUTURE_DATE

    def test_too_old_date_is_error(self):
        """5年以上前の日付はエラー"""
        five_years_ago = (datetime.now() - timedelta(days=365 * 5 + 1)).strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(five_years_ago)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.TOO_OLD_DATE

    def test_invalid_format_is_error(self):
        """不正な形式の日付はエラー"""
        result = MatchValidator.validate_date("invalid-date")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_DATE_FORMAT

    def test_empty_string_is_error(self):
        """空文字はエラー"""
        result = MatchValidator.validate_date("")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_DATE_FORMAT

    def test_five_years_ago_plus_one_day_is_valid(self):
        """ちょうど5年前の翌日は有効（境界値）"""
        five_years_ago_plus_one = (datetime.now() - timedelta(days=365 * 5 - 1)).strftime("%Y-%m-%d")
        result = MatchValidator.validate_date(five_years_ago_plus_one)
        assert result.is_valid is True
        assert len(result.errors) == 0


class TestRankValidation:
    """順位バリデーションのテスト"""

    # 正常系 - 3人麻雀
    def test_rank_1_is_valid_three(self):
        """順位1は有効（3麻）"""
        result = MatchValidator.validate_rank(1, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_rank_2_is_valid_three(self):
        """順位2は有効（3麻）"""
        result = MatchValidator.validate_rank(2, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_rank_3_is_valid_three(self):
        """順位3は有効（3麻）"""
        result = MatchValidator.validate_rank(3, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 正常系 - 4人麻雀
    def test_rank_1_is_valid_four(self):
        """順位1は有効（4麻）"""
        result = MatchValidator.validate_rank(1, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_rank_2_is_valid_four(self):
        """順位2は有効（4麻）"""
        result = MatchValidator.validate_rank(2, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_rank_3_is_valid_four(self):
        """順位3は有効（4麻）"""
        result = MatchValidator.validate_rank(3, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_rank_4_is_valid_four(self):
        """順位4は有効（4麻）"""
        result = MatchValidator.validate_rank(4, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 異常系 - 3人麻雀
    def test_rank_0_is_error_three(self):
        """順位0はエラー（3麻）"""
        result = MatchValidator.validate_rank(0, "three")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RANK

    def test_rank_4_is_error_three(self):
        """順位4はエラー（3麻）"""
        result = MatchValidator.validate_rank(4, "three")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RANK

    def test_negative_rank_is_error_three(self):
        """負の順位はエラー（3麻）"""
        result = MatchValidator.validate_rank(-1, "three")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RANK

    # 異常系 - 4人麻雀
    def test_rank_0_is_error_four(self):
        """順位0はエラー（4麻）"""
        result = MatchValidator.validate_rank(0, "four")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RANK

    def test_rank_5_is_error_four(self):
        """順位5はエラー（4麻）"""
        result = MatchValidator.validate_rank(5, "four")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RANK

    def test_negative_rank_is_error_four(self):
        """負の順位はエラー（4麻）"""
        result = MatchValidator.validate_rank(-1, "four")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RANK


class TestFinalPointsValidation:
    """最終ポイントバリデーションのテスト"""

    # 正常系
    def test_zero_is_valid(self):
        """0.0は有効"""
        result = MatchValidator.validate_final_points(0.0)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_positive_decimal_is_valid(self):
        """50.5は有効"""
        result = MatchValidator.validate_final_points(50.5)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_negative_decimal_is_valid(self):
        """-50.5は有効"""
        result = MatchValidator.validate_final_points(-50.5)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_max_value_is_valid(self):
        """999.9は有効"""
        result = MatchValidator.validate_final_points(999.9)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_min_value_is_valid(self):
        """-999.9は有効"""
        result = MatchValidator.validate_final_points(-999.9)
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 異常系 - 範囲外
    def test_over_max_is_error(self):
        """1000.0はエラー"""
        result = MatchValidator.validate_final_points(1000.0)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FINAL_POINTS_RANGE

    def test_under_min_is_error(self):
        """-1000.0はエラー"""
        result = MatchValidator.validate_final_points(-1000.0)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FINAL_POINTS_RANGE

    # 異常系 - 精度
    def test_two_decimal_places_is_error(self):
        """50.55はエラー（小数第2位）"""
        result = MatchValidator.validate_final_points(50.55)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION

    def test_three_decimal_places_is_error(self):
        """50.123はエラー（小数第3位）"""
        result = MatchValidator.validate_final_points(50.123)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION


class TestRawScoreValidation:
    """素点バリデーションのテスト"""

    # 正常系
    def test_zero_is_valid(self):
        """0は有効"""
        result = MatchValidator.validate_raw_score(0)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_positive_score_is_valid(self):
        """25000は有効"""
        result = MatchValidator.validate_raw_score(25000)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_negative_score_is_valid(self):
        """-25000は有効"""
        result = MatchValidator.validate_raw_score(-25000)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_max_value_is_valid(self):
        """999900は有効"""
        result = MatchValidator.validate_raw_score(999900)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_min_value_is_valid(self):
        """-999900は有効"""
        result = MatchValidator.validate_raw_score(-999900)
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 異常系 - 範囲外
    def test_over_max_is_error(self):
        """1000000はエラー"""
        result = MatchValidator.validate_raw_score(1000000)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RAW_SCORE_RANGE

    def test_under_min_is_error(self):
        """-1000000はエラー"""
        result = MatchValidator.validate_raw_score(-1000000)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RAW_SCORE_RANGE

    # 異常系 - 単位
    def test_not_hundred_unit_is_error(self):
        """25050はエラー（下2桁が50）"""
        result = MatchValidator.validate_raw_score(25050)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RAW_SCORE_UNIT

    def test_not_hundred_unit_01_is_error(self):
        """25001はエラー（下2桁が01）"""
        result = MatchValidator.validate_raw_score(25001)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RAW_SCORE_UNIT

    def test_negative_not_hundred_unit_is_error(self):
        """-25050はエラー（下2桁が50）"""
        result = MatchValidator.validate_raw_score(-25050)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_RAW_SCORE_UNIT

    # 境界値
    def test_hundred_is_valid(self):
        """100は有効（最小単位）"""
        result = MatchValidator.validate_raw_score(100)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_negative_hundred_is_valid(self):
        """-100は有効（最小単位）"""
        result = MatchValidator.validate_raw_score(-100)
        assert result.is_valid is True
        assert len(result.errors) == 0


class TestChipCountValidation:
    """チップ数バリデーションのテスト"""

    # 正常系
    def test_zero_is_valid(self):
        """0は有効"""
        result = MatchValidator.validate_chip_count(0)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_one_is_valid(self):
        """1は有効"""
        result = MatchValidator.validate_chip_count(1)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_ten_is_valid(self):
        """10は有効"""
        result = MatchValidator.validate_chip_count(10)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_hundred_is_valid(self):
        """100は有効"""
        result = MatchValidator.validate_chip_count(100)
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 異常系
    def test_negative_one_is_error(self):
        """-1はエラー"""
        result = MatchValidator.validate_chip_count(-1)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_CHIP_COUNT

    def test_negative_ten_is_error(self):
        """-10はエラー"""
        result = MatchValidator.validate_chip_count(-10)
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_CHIP_COUNT


class TestFloatingCountValidation:
    """浮き人数バリデーションのテスト"""

    # 正常系 - 3人麻雀
    def test_zero_is_valid_three(self):
        """0は有効（3麻）"""
        result = MatchValidator.validate_floating_count(0, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_one_is_valid_three(self):
        """1は有効（3麻）"""
        result = MatchValidator.validate_floating_count(1, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_two_is_valid_three(self):
        """2は有効（3麻）"""
        result = MatchValidator.validate_floating_count(2, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_three_is_valid_three(self):
        """3は有効（3麻）"""
        result = MatchValidator.validate_floating_count(3, "three")
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 正常系 - 4人麻雀
    def test_zero_is_valid_four(self):
        """0は有効（4麻）"""
        result = MatchValidator.validate_floating_count(0, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_one_is_valid_four(self):
        """1は有効（4麻）"""
        result = MatchValidator.validate_floating_count(1, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_two_is_valid_four(self):
        """2は有効（4麻）"""
        result = MatchValidator.validate_floating_count(2, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_three_is_valid_four(self):
        """3は有効（4麻）"""
        result = MatchValidator.validate_floating_count(3, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_four_is_valid_four(self):
        """4は有効（4麻）"""
        result = MatchValidator.validate_floating_count(4, "four")
        assert result.is_valid is True
        assert len(result.errors) == 0

    # 異常系 - 3人麻雀
    def test_negative_one_is_error_three(self):
        """-1はエラー（3麻）"""
        result = MatchValidator.validate_floating_count(-1, "three")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE

    def test_four_is_error_three(self):
        """4はエラー（3麻）"""
        result = MatchValidator.validate_floating_count(4, "three")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE

    # 異常系 - 4人麻雀
    def test_negative_one_is_error_four(self):
        """-1はエラー（4麻）"""
        result = MatchValidator.validate_floating_count(-1, "four")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE

    def test_five_is_error_four(self):
        """5はエラー（4麻）"""
        result = MatchValidator.validate_floating_count(5, "four")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE
