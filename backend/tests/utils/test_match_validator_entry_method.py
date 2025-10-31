"""
入力方式別バリデーションのテスト
"""

import pytest
from datetime import datetime

from app.utils.match_validator import MatchValidator
from app.utils.validation_types import ValidationErrorCode
from app.models.ruleset import Ruleset
from tests.fixtures.rulesets import (
    FIXED_UMA_FOUR,
    FLOATING_UMA_FOUR,
    FIXED_UMA_THREE,
    FLOATING_UMA_THREE,
)


class TestRankPlusPoints:
    """Mode 1: 順位+最終ポイント (rank_plus_points)"""

    def test_fixed_uma_normal_input_is_valid(self):
        """正常な入力は有効（固定ウマ、4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=55.0,  # (35000-30000)/1000 + 30 + 20 = 55.0
        )
        
        assert result.is_valid is True

    def test_top_points_below_minimum_is_error(self):
        """トップの下限チェック（4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=49.0,  # 下限50.0未満
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM for e in result.errors)

    def test_last_points_above_maximum_is_error(self):
        """ラスの上限チェック（4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=4,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=-29.0,  # 上限-30.0超過
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM for e in result.errors)

    def test_floating_count_with_fixed_uma_is_error(self):
        """浮き人数を入力するとエラー（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=55.0,
            floating_count=2,  # 固定ウマでは不要
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA for e in result.errors)

    def test_missing_final_points_is_error(self):
        """最終ポイント未入力はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            # final_points未入力
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.MISSING_FINAL_POINTS for e in result.errors)

    def test_floating_uma_normal_input_is_valid(self):
        """正常な入力は有効（浮きウマ、4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            final_points=12.0,  # 浮き1人: ウマ12 + オカ0 = 12.0
            floating_count=1,
        )
        
        assert result.is_valid is True

    def test_floating_uma_top_points_below_minimum_is_error(self):
        """トップの下限チェック（浮き1人）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            final_points=11.0,  # 下限12.0未満
            floating_count=1,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM for e in result.errors)

    def test_floating_uma_last_points_above_maximum_is_error(self):
        """ラスの上限チェック（浮き1人）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=4,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            final_points=-7.0,  # 上限-8.0超過
            floating_count=1,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM for e in result.errors)


class TestRankPlusRaw:
    """Mode 2: 順位+素点 (rank_plus_raw)"""

    def test_fixed_uma_normal_input_is_valid(self):
        """正常な入力は有効（固定ウマ、4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            raw_score=35000,
        )
        
        assert result.is_valid is True

    def test_missing_raw_score_is_error(self):
        """素点未入力はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            # raw_score未入力
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.MISSING_RAW_SCORE for e in result.errors)

    def test_floating_count_with_fixed_uma_is_error(self):
        """浮き人数を入力するとエラー（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            raw_score=35000,
            floating_count=2,  # 固定ウマでは不要
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA for e in result.errors)

    def test_floating_uma_normal_input_is_valid(self):
        """正常な入力は有効（浮きウマ、3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=40000,
            floating_count=1,
        )
        
        assert result.is_valid is True

    def test_missing_floating_count_is_error(self):
        """浮き人数未入力はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=40000,
            # floating_count未入力
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.MISSING_FLOATING_COUNT for e in result.errors)

    def test_composite_validation_floating_score_with_zero_count(self):
        """複合バリデーション: 自分が浮いているのに浮き人数0"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=40000,  # 基準点35000より大きい
            floating_count=0,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.FLOATING_SCORE_WITH_ZERO_COUNT for e in result.errors)

    def test_composite_validation_top_rank_sinking_with_floating(self):
        """複合バリデーション: 1位で浮き2人以上なのに沈み"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=30000,  # 基準点35000より小さい
            floating_count=2,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.TOP_RANK_SINKING_WITH_FLOATING for e in result.errors)


class TestProvisionalRankOnly:
    """Mode 3: 仮ポイント (provisional_rank_only)"""

    def test_fixed_uma_rank_1_is_valid(self):
        """正常な入力は有効（固定ウマ、4麻、1位）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
        )
        
        assert result.is_valid is True

    def test_fixed_uma_rank_2_is_valid(self):
        """2位の入力は有効（固定ウマ、4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=2,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
        )
        
        assert result.is_valid is True

    def test_fixed_uma_rank_3_is_valid(self):
        """3位の入力は有効（固定ウマ、4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=3,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
        )
        
        assert result.is_valid is True

    def test_fixed_uma_rank_4_is_valid(self):
        """4位の入力は有効（固定ウマ、4麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=4,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
        )
        
        assert result.is_valid is True

    def test_floating_count_with_fixed_uma_is_error(self):
        """浮き人数を入力するとエラー（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            floating_count=2,  # 固定ウマでは不要
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA for e in result.errors)

    def test_floating_uma_normal_input_is_valid(self):
        """正常な入力は有効（浮きウマ、3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            floating_count=1,
        )
        
        assert result.is_valid is True

    def test_missing_floating_count_is_error(self):
        """浮き人数未入力はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            # floating_count未入力
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.MISSING_FLOATING_COUNT for e in result.errors)

    def test_zero_floating_with_equal_points_is_error(self):
        """開始点=基準点で浮き人数0はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),  # 30000点持ち30000点返し
            floating_count=0,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING for e in result.errors)

    def test_all_floating_with_lower_start_is_error(self):
        """開始点<基準点で浮き人数=ゲームモード人数はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),  # 30000点持ち35000点返し
            floating_count=3,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING for e in result.errors)


class TestEntryMethodCombination:
    """入力方式の組み合わせテスト"""

    def test_rank_plus_points_with_raw_score_ignores_raw_score(self):
        """rank_plus_pointsで素点を入力しても無視される"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=55.0,
            raw_score=35000,  # 入力されているが無視される
        )
        
        assert result.is_valid is True

    def test_rank_plus_raw_with_final_points_ignores_final_points(self):
        """rank_plus_rawで最終ポイントを入力しても無視される"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            raw_score=35000,
            final_points=55.0,  # 入力されているが無視される
        )
        
        assert result.is_valid is True

    def test_provisional_rank_only_with_extra_fields_ignores_them(self):
        """provisional_rank_onlyで素点と最終ポイントを入力しても無視される"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="provisional_rank_only",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            raw_score=35000,  # 入力されているが無視される
            final_points=55.0,  # 入力されているが無視される
        )
        
        assert result.is_valid is True
