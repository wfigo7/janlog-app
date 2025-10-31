"""
FloatingUmaValidatorのテスト
"""

import pytest
from app.utils.floating_uma_validator import FloatingUmaValidator


class TestFloatingUmaValidator:
    """FloatingUmaValidatorのテストクラス"""

    def test_validate_uma_array_four_player_valid(self):
        """4人麻雀の有効なウマ配列のバリデーション"""
        uma_array = [30, 10, -10, -30]
        errors = FloatingUmaValidator.validate_uma_array(uma_array, "four")
        assert errors == []

    def test_validate_uma_array_three_player_valid(self):
        """3人麻雀の有効なウマ配列のバリデーション"""
        uma_array = [20, 0, -20]
        errors = FloatingUmaValidator.validate_uma_array(uma_array, "three")
        assert errors == []

    def test_validate_uma_array_invalid_length_four_player(self):
        """4人麻雀で要素数が不正なウマ配列のバリデーション"""
        uma_array = [20, 0, -20]  # 3要素（4人麻雀では不正）
        errors = FloatingUmaValidator.validate_uma_array(uma_array, "four")
        assert len(errors) == 1
        assert "4要素" in errors[0]

    def test_validate_uma_array_invalid_length_three_player(self):
        """3人麻雀で要素数が不正なウマ配列のバリデーション"""
        uma_array = [30, 10, -10, -30]  # 4要素（3人麻雀では不正）
        errors = FloatingUmaValidator.validate_uma_array(uma_array, "three")
        assert len(errors) == 1
        assert "3要素" in errors[0]

    def test_validate_uma_array_invalid_sum(self):
        """合計が0でないウマ配列のバリデーション"""
        uma_array = [30, 10, -10, -20]  # 合計が10
        errors = FloatingUmaValidator.validate_uma_array(uma_array, "four")
        assert len(errors) == 1
        assert "合計は0" in errors[0]
        assert "10" in errors[0]

    def test_get_valid_floating_counts_equal_points_four_player(self):
        """開始点=基準点の場合の有効な浮き人数範囲（4人麻雀）"""
        min_count, max_count = FloatingUmaValidator.get_valid_floating_counts(
            30000, 30000, "four"
        )
        assert min_count == 1
        assert max_count == 4

    def test_get_valid_floating_counts_equal_points_three_player(self):
        """開始点=基準点の場合の有効な浮き人数範囲（3人麻雀）"""
        min_count, max_count = FloatingUmaValidator.get_valid_floating_counts(
            35000, 35000, "three"
        )
        assert min_count == 1
        assert max_count == 3


    def test_get_valid_floating_counts_starting_less_than_base_four_player(self):
        """開始点<基準点の場合の有効な浮き人数範囲（4人麻雀）"""
        min_count, max_count = FloatingUmaValidator.get_valid_floating_counts(
            25000, 30000, "four"
        )
        assert min_count == 0
        assert max_count == 3

    def test_get_valid_floating_counts_starting_less_than_base_three_player(self):
        """開始点<基準点の場合の有効な浮き人数範囲（3人麻雀）"""
        min_count, max_count = FloatingUmaValidator.get_valid_floating_counts(
            30000, 35000, "three"
        )
        assert min_count == 0
        assert max_count == 2

    def test_get_valid_floating_counts_invalid_starting_greater_than_base(self):
        """開始点>基準点の場合はエラー"""
        with pytest.raises(ValueError) as exc_info:
            FloatingUmaValidator.get_valid_floating_counts(35000, 30000, "four")
        assert "開始点は基準点以下" in str(exc_info.value)

    def test_validate_uma_matrix_valid_equal_points(self):
        """開始点=基準点の場合の有効な浮き人数別ウマ表のバリデーション"""
        uma_matrix = {
            "0": [0, 0, 0, 0],
            "1": [12, -1, -3, -8],
            "2": [8, 4, -4, -8],
            "3": [8, 3, 1, -12],
            "4": [0, 0, 0, 0],
        }
        errors = FloatingUmaValidator.validate_uma_matrix(
            uma_matrix, "four", 30000, 30000
        )
        assert errors == []

    def test_validate_uma_matrix_valid_starting_less_than_base(self):
        """開始点<基準点の場合の有効な浮き人数別ウマ表のバリデーション"""
        uma_matrix = {
            "0": [0, 0, 0, 0],
            "1": [20, -5, -5, -10],
            "2": [15, 5, -5, -15],
            "3": [10, 5, -5, -10],
            "4": [0, 0, 0, 0],
        }
        errors = FloatingUmaValidator.validate_uma_matrix(
            uma_matrix, "four", 25000, 30000
        )
        assert errors == []

    def test_validate_uma_matrix_invalid_unused_floating_count(self):
        """使用されない浮き人数のウマ配列が[0,0,0,0]でない場合"""
        uma_matrix = {
            "0": [10, 5, -5, -10],  # 開始点=基準点では使用されない
            "1": [12, -1, -3, -8],
            "2": [8, 4, -4, -8],
            "3": [8, 3, 1, -12],
            "4": [0, 0, 0, 0],
        }
        errors = FloatingUmaValidator.validate_uma_matrix(
            uma_matrix, "four", 30000, 30000
        )
        assert len(errors) == 1
        assert "浮き人数0" in errors[0]
        assert "使用されない" in errors[0]

    def test_validate_uma_matrix_invalid_sum(self):
        """使用される浮き人数のウマ配列の合計が0でない場合"""
        uma_matrix = {
            "0": [0, 0, 0, 0],
            "1": [12, -1, -3, -7],  # 合計が1
            "2": [8, 4, -4, -8],
            "3": [8, 3, 1, -12],
            "4": [0, 0, 0, 0],
        }
        errors = FloatingUmaValidator.validate_uma_matrix(
            uma_matrix, "four", 30000, 30000
        )
        assert len(errors) == 1
        assert "浮き人数1" in errors[0]
        assert "合計は0" in errors[0]

    def test_validate_uma_matrix_missing_key(self):
        """浮き人数のキーが存在しない場合"""
        uma_matrix = {
            "0": [0, 0, 0, 0],
            "1": [12, -1, -3, -8],
            # "2"が欠落
            "3": [8, 3, 1, -12],
            "4": [0, 0, 0, 0],
        }
        errors = FloatingUmaValidator.validate_uma_matrix(
            uma_matrix, "four", 30000, 30000
        )
        assert len(errors) == 1
        assert "浮き人数2" in errors[0]
        assert "存在しません" in errors[0]

    def test_validate_floating_count_valid(self):
        """有効な浮き人数のバリデーション"""
        errors = FloatingUmaValidator.validate_floating_count(2, 30000, 30000, "four")
        assert errors == []

    def test_validate_floating_count_too_small(self):
        """浮き人数が範囲より小さい場合"""
        errors = FloatingUmaValidator.validate_floating_count(0, 30000, 30000, "four")
        assert len(errors) == 1
        assert "1〜4の範囲" in errors[0]

    def test_validate_floating_count_too_large(self):
        """浮き人数が範囲より大きい場合"""
        errors = FloatingUmaValidator.validate_floating_count(5, 30000, 30000, "four")
        assert len(errors) == 1
        assert "1〜4の範囲" in errors[0]

    def test_validate_floating_count_invalid_starting_points(self):
        """開始点が基準点より大きい場合"""
        errors = FloatingUmaValidator.validate_floating_count(2, 35000, 30000, "four")
        assert len(errors) == 1
        assert "開始点は基準点以下" in errors[0]

    def test_validate_uma_matrix_three_player(self):
        """3人麻雀の浮き人数別ウマ表のバリデーション"""
        uma_matrix = {
            "0": [0, 0, 0],
            "1": [40, -20, -20],
            "2": [20, 0, -20],
            "3": [0, 0, 0],
            "4": [0, 0, 0],  # 3人麻雀では使用されない
        }
        errors = FloatingUmaValidator.validate_uma_matrix(
            uma_matrix, "three", 30000, 35000
        )
        assert errors == []
