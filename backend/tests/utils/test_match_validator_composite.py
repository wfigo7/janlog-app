"""
複合バリデーションのテスト
"""

import pytest
from datetime import datetime

from app.utils.match_validator import MatchValidator
from app.utils.validation_types import ValidationErrorCode
from tests.fixtures.rulesets import (
    FIXED_UMA_FOUR,
    FLOATING_UMA_FOUR,
    FLOATING_UMA_THREE,
)
from app.models.ruleset import Ruleset


class TestFloatingCountExistence:
    """浮き人数の存在可能性バリデーション"""

    def test_zero_floating_with_equal_points_is_error(self):
        """開始点=基準点で浮き人数0はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),  # 30000点持ち30000点返し
            raw_score=30000,
            floating_count=0,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING for e in result.errors)

    def test_one_floating_with_equal_points_is_valid(self):
        """開始点=基準点で浮き人数1は有効"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            raw_score=35000,
            floating_count=1,
        )
        
        assert result.is_valid is True

    def test_all_floating_with_lower_start_is_error(self):
        """開始点<基準点で浮き人数=ゲームモード人数はエラー（3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),  # 30000点持ち35000点返し
            raw_score=40000,
            floating_count=3,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING for e in result.errors)

    def test_two_floating_with_lower_start_is_valid(self):
        """開始点<基準点で浮き人数2は有効（3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=40000,
            floating_count=2,
        )
        
        assert result.is_valid is True


class TestRawScoreFloatingConsistency:
    """素点と浮き人数の整合性バリデーション"""

    def test_floating_score_with_zero_count_is_error(self):
        """素点が基準点以上で浮き人数0はエラー"""
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

    def test_floating_score_with_one_count_is_valid(self):
        """素点が基準点以上で浮き人数1は有効"""
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

    def test_sinking_score_with_all_floating_is_error(self):
        """素点が基準点未満で全員浮きはエラー（3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=3,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=30000,  # 基準点35000より小さい
            floating_count=3,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.SINKING_SCORE_WITH_ALL_FLOATING for e in result.errors)

    def test_sinking_score_with_two_floating_is_valid(self):
        """素点が基準点未満で浮き人数2は有効（3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=3,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=30000,
            floating_count=2,
        )
        
        assert result.is_valid is True

    def test_equal_points_with_zero_floating_is_error(self):
        """開始点=基準点で浮き人数0はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),  # 30000点持ち30000点返し
            raw_score=30000,
            floating_count=0,
        )
        
        assert result.is_valid is False
        # E-10-01またはE-20-03のいずれかが検出されればOK（E-10-01の方が先に検出される）
        assert any(
            e.code in [ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING, ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_EQUAL_POINTS]
            for e in result.errors
        )

    def test_lower_start_with_max_floating_is_error(self):
        """開始点<基準点で浮き人数3はエラー（3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),  # 30000点持ち35000点返し
            raw_score=40000,
            floating_count=3,
        )
        
        assert result.is_valid is False
        # E-10-02またはE-20-04のいずれかが検出されればOK（E-10-02の方が先に検出される）
        assert any(
            e.code in [ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING, ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_LOWER_START]
            for e in result.errors
        )


class TestRankRawScoreRelation:
    """順位と素点の関係バリデーション"""

    def test_top_rank_sinking_with_floating_is_error(self):
        """1位で浮き2人以上なのに素点が基準点未満はエラー"""
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

    def test_top_rank_floating_with_two_floating_is_valid(self):
        """1位で浮き2人以上で素点が基準点以上は有効"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=40000,
            floating_count=2,
        )
        
        assert result.is_valid is True

    def test_top_rank_sinking_with_one_floating_is_valid(self):
        """1位で浮き1人なら素点が基準点未満でも有効（全員同点）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=30000,
            floating_count=1,
        )
        
        assert result.is_valid is True

    def test_last_rank_floating_without_all_floating_is_error(self):
        """3位で浮き1人なのに素点が基準点より大きいはエラー（3麻）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=3,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=36000,  # 基準点35000より大きい
            floating_count=1,
        )
        
        assert result.is_valid is False
        assert any(
            e.code == ValidationErrorCode.LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING
            for e in result.errors
        )

    def test_last_rank_equal_with_two_floating_is_valid(self):
        """3位で浮き2人なら素点が基準点でも有効（3麻、全員同点）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=3,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=35000,  # 基準点と同じ
            floating_count=2,
        )
        
        assert result.is_valid is True

    def test_last_rank_floating_with_lower_start_is_error(self):
        """開始点<基準点で最下位が基準点より大きいはエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=3,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),  # 30000点持ち35000点返し
            raw_score=36000,  # 基準点35000より大きい
            floating_count=2,
        )
        
        assert result.is_valid is False
        assert any(
            e.code == ValidationErrorCode.LAST_RANK_FLOATING_WITH_LOWER_START
            for e in result.errors
        )

    def test_last_rank_sinking_with_lower_start_is_valid(self):
        """開始点<基準点で最下位が基準点以下は有効"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=3,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=30000,
            floating_count=2,
        )
        
        assert result.is_valid is True

    def test_all_floating_with_sinking_score_is_error(self):
        """開始点=基準点で全員浮きなのに素点が基準点未満はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=4,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),  # 30000点持ち30000点返し
            raw_score=29000,  # 基準点30000より小さい
            floating_count=4,
        )
        
        assert result.is_valid is False
        assert any(
            e.code == ValidationErrorCode.ALL_FLOATING_WITH_SINKING_SCORE
            for e in result.errors
        )

    def test_all_floating_with_equal_score_is_valid(self):
        """全員浮きで素点が基準点以上は有効"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=4,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            raw_score=30000,
            floating_count=4,
        )
        
        assert result.is_valid is True

    def test_all_sinking_with_floating_score_is_error(self):
        """全員沈みなのに素点が基準点以上はエラー"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=35000,  # 基準点35000以上
            floating_count=0,
        )
        
        assert result.is_valid is False
        assert any(
            e.code == ValidationErrorCode.ALL_SINKING_WITH_FLOATING_SCORE
            for e in result.errors
        )

    def test_all_sinking_with_sinking_score_is_valid(self):
        """全員沈みで素点が基準点未満は有効"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="three",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_THREE.to_dict()),
            raw_score=34000,
            floating_count=0,
        )
        
        assert result.is_valid is True


class TestFinalPointsValidation:
    """最終ポイント関連のバリデーション"""

    def test_top_points_below_minimum_fixed_uma_is_error(self):
        """1位の最終ポイントが下限未満はエラー（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),  # ウマ[30, 10, -10, -30], オカ20
            final_points=49.0,  # 下限は50.0（ウマ30 + オカ20）
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM for e in result.errors)

    def test_top_points_at_minimum_fixed_uma_is_valid(self):
        """1位の最終ポイントが下限以上は有効（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=50.0,
        )
        
        assert result.is_valid is True

    def test_top_points_below_minimum_floating_uma_is_error(self):
        """1位の最終ポイントが下限未満はエラー（浮きウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),  # 浮き1人: ウマ[12, -1, -3, -8], オカ0
            final_points=11.0,  # 下限は12.0（ウマ12 + オカ0）
            floating_count=1,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM for e in result.errors)

    def test_top_points_at_minimum_floating_uma_is_valid(self):
        """1位の最終ポイントが下限以上は有効（浮きウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=1,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            final_points=12.0,
            floating_count=1,
        )
        
        assert result.is_valid is True

    def test_last_points_above_maximum_fixed_uma_is_error(self):
        """4位の最終ポイントが上限超過はエラー（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=4,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),  # ウマ[30, 10, -10, -30]
            final_points=-29.0,  # 上限は-30.0（ウマ-30）
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM for e in result.errors)

    def test_last_points_at_maximum_fixed_uma_is_valid(self):
        """4位の最終ポイントが上限以下は有効（固定ウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=4,
            ruleset=Ruleset.model_validate(FIXED_UMA_FOUR.to_dict()),
            final_points=-30.0,
        )
        
        assert result.is_valid is True

    def test_last_points_above_maximum_floating_uma_is_error(self):
        """4位の最終ポイントが上限超過はエラー（浮きウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=4,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),  # 浮き1人: ウマ[12, -1, -3, -8]
            final_points=-7.0,  # 上限は-8.0（ウマ-8）
            floating_count=1,
        )
        
        assert result.is_valid is False
        assert any(e.code == ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM for e in result.errors)

    def test_last_points_at_maximum_floating_uma_is_valid(self):
        """4位の最終ポイントが上限以下は有効（浮きウマ）"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = MatchValidator.validate(
            date=today,
            game_mode="four",
            entry_method="rank_plus_points",
            rank=4,
            ruleset=Ruleset.model_validate(FLOATING_UMA_FOUR.to_dict()),
            final_points=-8.0,
            floating_count=1,
        )
        
        assert result.is_valid is True
