"""
FloatingUmaCalculatorのテスト
"""

import pytest
from app.utils.floating_uma_calculator import FloatingUmaCalculator
from app.models.ruleset import Ruleset


class TestFloatingUmaCalculator:
    """FloatingUmaCalculatorのテストクラス"""

    @pytest.fixture
    def ruleset_four_player(self):
        """4人麻雀の浮きウマルールセット"""
        return Ruleset(
            rulesetId="test-ruleset-1",
            ruleName="日本プロ麻雀連盟ルール",
            gameMode="four",
            startingPoints=30000,
            basePoints=30000,
            useFloatingUma=True,
            uma=[30, 10, -10, -30],  # 標準ウマ（使用されない）
            umaMatrix={
                "0": [0, 0, 0, 0],
                "1": [12, -1, -3, -8],
                "2": [8, 4, -4, -8],
                "3": [8, 3, 1, -12],
                "4": [0, 0, 0, 0],
            },
            oka=0,
            useChips=False,
            isGlobal=True,
            createdBy="admin",
        )

    @pytest.fixture
    def ruleset_three_player(self):
        """3人麻雀の浮きウマルールセット"""
        return Ruleset(
            rulesetId="test-ruleset-2",
            ruleName="3人麻雀浮きウマルール",
            gameMode="three",
            startingPoints=30000,
            basePoints=35000,
            useFloatingUma=True,
            uma=[20, 0, -20],  # 標準ウマ（使用されない）
            umaMatrix={
                "0": [0, 0, 0],
                "1": [40, -20, -20],
                "2": [20, 0, -20],
                "3": [0, 0, 0],
                "4": [0, 0, 0],
            },
            oka=15,
            useChips=False,
            isGlobal=False,
            createdBy="test-user",
        )

    def test_is_player_floating_true(self):
        """素点が基準点以上の場合は浮き"""
        assert FloatingUmaCalculator.is_player_floating(35000, 30000) is True
        assert FloatingUmaCalculator.is_player_floating(30000, 30000) is True

    def test_is_player_floating_false(self):
        """素点が基準点未満の場合は沈み"""
        assert FloatingUmaCalculator.is_player_floating(29999, 30000) is False
        assert FloatingUmaCalculator.is_player_floating(20000, 30000) is False

    def test_get_uma_for_floating_count_valid(self):
        """有効な浮き人数のウマ配列取得"""
        uma_matrix = {
            "0": [0, 0, 0, 0],
            "1": [12, -1, -3, -8],
            "2": [8, 4, -4, -8],
            "3": [8, 3, 1, -12],
            "4": [0, 0, 0, 0],
        }
        
        uma_array = FloatingUmaCalculator.get_uma_for_floating_count(2, uma_matrix)
        assert uma_array == [8, 4, -4, -8]

    def test_get_uma_for_floating_count_none_matrix(self):
        """umaMatrixがNoneの場合はエラー"""
        with pytest.raises(ValueError) as exc_info:
            FloatingUmaCalculator.get_uma_for_floating_count(2, None)
        assert "浮きウマ表が設定されていません" in str(exc_info.value)

    def test_get_uma_for_floating_count_missing_key(self):
        """該当する浮き人数が存在しない場合はエラー"""
        uma_matrix = {
            "0": [0, 0, 0, 0],
            "1": [12, -1, -3, -8],
            # "2"が欠落
            "3": [8, 3, 1, -12],
            "4": [0, 0, 0, 0],
        }
        
        with pytest.raises(ValueError) as exc_info:
            FloatingUmaCalculator.get_uma_for_floating_count(2, uma_matrix)
        assert "浮き人数2のウマ配列が存在しません" in str(exc_info.value)

    def test_calculate_points_all_floating_counts(self, ruleset_four_player):
        """全ての浮き人数パターンでのポイント計算"""
        # 同じ素点・順位で浮き人数を変えてテスト
        raw_score = 35000
        rank = 1
        
        # 浮き1人
        points_1 = FloatingUmaCalculator.calculate_points(
            raw_score, rank, 1, ruleset_four_player
        )
        assert points_1 == 17.0  # 5.0 + 12 + 0
        
        # 浮き2人
        points_2 = FloatingUmaCalculator.calculate_points(
            raw_score, rank, 2, ruleset_four_player
        )
        assert points_2 == 13.0  # 5.0 + 8 + 0
        
        # 浮き3人
        points_3 = FloatingUmaCalculator.calculate_points(
            raw_score, rank, 3, ruleset_four_player
        )
        assert points_3 == 13.0  # 5.0 + 8 + 0

    def test_calculate_points_floating_1_rank_1(self, ruleset_four_player):
        """浮き1人、1位のポイント計算"""
        # 素点45000、基準点30000、浮き1人、1位
        # 基本計算: (45000 - 30000) / 1000 = 15.0
        # ウマ: 12
        # オカ: 0
        # 最終: 15.0 + 12 + 0 = 27.0
        final_points = FloatingUmaCalculator.calculate_points(
            45000, 1, 1, ruleset_four_player
        )
        assert final_points == 27.0

    def test_calculate_points_floating_2_rank_2(self, ruleset_four_player):
        """浮き2人、2位のポイント計算"""
        # 素点32000、基準点30000、浮き2人、2位
        # 基本計算: (32000 - 30000) / 1000 = 2.0
        # ウマ: 4
        # オカ: 0
        # 最終: 2.0 + 4 + 0 = 6.0
        final_points = FloatingUmaCalculator.calculate_points(
            32000, 2, 2, ruleset_four_player
        )
        assert final_points == 6.0

    def test_calculate_points_floating_3_rank_3(self, ruleset_four_player):
        """浮き3人、3位のポイント計算"""
        # 素点28000、基準点30000、浮き3人、3位
        # 基本計算: (28000 - 30000) / 1000 = -2.0
        # ウマ: 1
        # オカ: 0
        # 最終: -2.0 + 1 + 0 = -1.0
        final_points = FloatingUmaCalculator.calculate_points(
            28000, 3, 3, ruleset_four_player
        )
        assert final_points == -1.0

    def test_calculate_points_floating_2_rank_4(self, ruleset_four_player):
        """浮き2人、4位のポイント計算"""
        # 素点18000、基準点30000、浮き2人、4位
        # 基本計算: (18000 - 30000) / 1000 = -12.0
        # ウマ: -8
        # オカ: 0
        # 最終: -12.0 + (-8) + 0 = -20.0
        final_points = FloatingUmaCalculator.calculate_points(
            18000, 4, 2, ruleset_four_player
        )
        assert final_points == -20.0

    def test_calculate_points_three_player_with_oka(self, ruleset_three_player):
        """3人麻雀、オカあり、1位のポイント計算"""
        # 素点52300、基準点35000、浮き1人、1位
        # 基本計算: (52300 - 35000) / 1000 = 17.3
        # ウマ: 40
        # オカ: 15
        # 最終: 17.3 + 40 + 15 = 72.3
        final_points = FloatingUmaCalculator.calculate_points(
            52300, 1, 1, ruleset_three_player
        )
        assert final_points == 72.3

    def test_calculate_points_three_player_rank_2(self, ruleset_three_player):
        """3人麻雀、2位のポイント計算"""
        # 素点38900、基準点35000、浮き2人、2位
        # 基本計算: (38900 - 35000) / 1000 = 3.9
        # ウマ: 0
        # オカ: 0
        # 最終: 3.9 + 0 + 0 = 3.9
        final_points = FloatingUmaCalculator.calculate_points(
            38900, 2, 2, ruleset_three_player
        )
        assert final_points == 3.9

    def test_calculate_points_three_player_rank_3(self, ruleset_three_player):
        """3人麻雀、3位のポイント計算"""
        # 素点13800、基準点35000、浮き0人、3位
        # 基本計算: (13800 - 35000) / 1000 = -21.2
        # ウマ: 0
        # オカ: 0
        # 最終: -21.2 + 0 + 0 = -21.2
        final_points = FloatingUmaCalculator.calculate_points(
            13800, 3, 0, ruleset_three_player
        )
        assert final_points == -21.2

    def test_calculate_points_rounding(self, ruleset_four_player):
        """小数点第1位までの丸め処理"""
        # 素点45123、基準点30000、浮き2人、1位
        # 基本計算: (45123 - 30000) / 1000 = 15.123
        # ウマ: 8
        # オカ: 0
        # 最終: 15.123 + 8 + 0 = 23.123 → 23.1（小数点第1位まで）
        final_points = FloatingUmaCalculator.calculate_points(
            45123, 1, 2, ruleset_four_player
        )
        assert final_points == 23.1

    def test_calculate_points_negative_rounding(self, ruleset_four_player):
        """負の値の小数点第1位までの丸め処理"""
        # 素点7777、基準点30000、浮き1人、4位
        # 基本計算: (7777 - 30000) / 1000 = -22.223
        # ウマ: -8
        # オカ: 0
        # 最終: -22.223 + (-8) + 0 = -30.223 → -30.2（小数点第1位まで）
        final_points = FloatingUmaCalculator.calculate_points(
            7777, 4, 1, ruleset_four_player
        )
        assert final_points == -30.2
