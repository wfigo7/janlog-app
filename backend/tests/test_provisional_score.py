"""
仮スコア計算のテスト
"""

import pytest
from app.utils.point_calculator import PointCalculator
from app.models.ruleset import Ruleset


class TestProvisionalScoreCalculation:
    """仮スコア計算のテストクラス"""

    def setup_method(self):
        """テスト用のルールセットを準備"""
        # Mリーグルール（4人麻雀）
        self.mleague_ruleset = Ruleset(
            rulesetId="test-mleague",
            ruleName="Mリーグルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            uma=[30, 10, -10, -30],
            oka=20,
            createdBy="test-user",
            isGlobal=True,
        )

        # 3人麻雀ルール
        self.three_player_ruleset = Ruleset(
            rulesetId="test-three",
            ruleName="3人麻雀標準",
            gameMode="three",
            startingPoints=35000,
            basePoints=40000,
            uma=[20, 0, -20],
            oka=15,
            createdBy="test-user",
            isGlobal=True,
        )

    def test_provisional_score_calculation_four_player_first_place(self):
        """4人麻雀1位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 1
        )

        # 仮素点: 25000 + 15000 = 40000点
        # 基本計算: (40000 - 30000) / 1000 = 10.0pt
        # ウマ: 30pt
        # オカ: 20pt
        # 合計: 10.0 + 30 + 20 = 60.0pt
        assert result["finalPoints"] == 60.0
        assert result["calculation"]["provisionalRawScore"] == 40000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == 10.0
        assert result["calculation"]["umaPoints"] == 30
        assert result["calculation"]["okaPoints"] == 20

    def test_provisional_score_calculation_four_player_second_place(self):
        """4人麻雀2位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 2
        )

        # 仮素点: 25000 + 5000 = 30000点
        # 基本計算: (30000 - 30000) / 1000 = 0.0pt
        # ウマ: 10pt
        # オカ: 0pt
        # 合計: 0.0 + 10 + 0 = 10.0pt
        assert result["finalPoints"] == 10.0
        assert result["calculation"]["provisionalRawScore"] == 30000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == 0.0
        assert result["calculation"]["umaPoints"] == 10
        assert result["calculation"]["okaPoints"] == 0

    def test_provisional_score_calculation_four_player_third_place(self):
        """4人麻雀3位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 3
        )

        # 仮素点: 25000 - 5000 = 20000点
        # 基本計算: (20000 - 30000) / 1000 = -10.0pt
        # ウマ: -10pt
        # オカ: 0pt
        # 合計: -10.0 + (-10) + 0 = -20.0pt
        assert result["finalPoints"] == -20.0
        assert result["calculation"]["provisionalRawScore"] == 20000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == -10.0
        assert result["calculation"]["umaPoints"] == -10
        assert result["calculation"]["okaPoints"] == 0

    def test_provisional_score_calculation_four_player_fourth_place(self):
        """4人麻雀4位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 4
        )

        # 仮素点: 25000 - 15000 = 10000点
        # 基本計算: (10000 - 30000) / 1000 = -20.0pt
        # ウマ: -30pt
        # オカ: 0pt
        # 合計: -20.0 + (-30) + 0 = -50.0pt
        assert result["finalPoints"] == -50.0
        assert result["calculation"]["provisionalRawScore"] == 10000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == -20.0
        assert result["calculation"]["umaPoints"] == -30
        assert result["calculation"]["okaPoints"] == 0

    def test_provisional_score_calculation_three_player_first_place(self):
        """3人麻雀1位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.three_player_ruleset, 1
        )

        # 仮素点: 35000 + 15000 = 50000点
        # 基本計算: (50000 - 40000) / 1000 = 10.0pt
        # ウマ: 20pt
        # オカ: 15pt
        # 合計: 10.0 + 20 + 15 = 45.0pt
        assert result["finalPoints"] == 45.0
        assert result["calculation"]["provisionalRawScore"] == 50000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == 10.0
        assert result["calculation"]["umaPoints"] == 20
        assert result["calculation"]["okaPoints"] == 15

    def test_provisional_score_calculation_three_player_second_place(self):
        """3人麻雀2位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.three_player_ruleset, 2
        )

        # 仮素点: 35000 + 0 = 35000点
        # 基本計算: (35000 - 40000) / 1000 = -5.0pt
        # ウマ: 0pt
        # オカ: 0pt
        # 合計: -5.0 + 0 + 0 = -5.0pt
        assert result["finalPoints"] == -5.0
        assert result["calculation"]["provisionalRawScore"] == 35000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == -5.0
        assert result["calculation"]["umaPoints"] == 0
        assert result["calculation"]["okaPoints"] == 0

    def test_provisional_score_calculation_three_player_third_place(self):
        """3人麻雀3位の仮スコア計算"""
        result = PointCalculator.calculate_provisional_points(
            self.three_player_ruleset, 3
        )

        # 仮素点: 35000 - 15000 = 20000点
        # 基本計算: (20000 - 40000) / 1000 = -20.0pt
        # ウマ: -20pt
        # オカ: 0pt
        # 合計: -20.0 + (-20) + 0 = -40.0pt
        assert result["finalPoints"] == -40.0
        assert result["calculation"]["provisionalRawScore"] == 20000
        assert result["calculation"]["isProvisional"] is True
        assert result["calculation"]["baseCalculation"] == -20.0
        assert result["calculation"]["umaPoints"] == -20
        assert result["calculation"]["okaPoints"] == 0

    def test_provisional_score_calculation_based_on_starting_points(self):
        """仮スコアが開始点ベースで正しく計算されることを確認"""
        # 4人麻雀（25000点スタート）
        # 1位: 25000 + 15000 = 40000点
        result_1st = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 1
        )
        assert result_1st["calculation"]["provisionalRawScore"] == 40000

        # 2位: 25000 + 5000 = 30000点
        result_2nd = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 2
        )
        assert result_2nd["calculation"]["provisionalRawScore"] == 30000

        # 3位: 25000 - 5000 = 20000点
        result_3rd = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 3
        )
        assert result_3rd["calculation"]["provisionalRawScore"] == 20000

        # 4位: 25000 - 15000 = 10000点
        result_4th = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 4
        )
        assert result_4th["calculation"]["provisionalRawScore"] == 10000

        # 3人麻雀（35000点スタート）
        # 1位: 35000 + 15000 = 50000点
        result_3p_1st = PointCalculator.calculate_provisional_points(
            self.three_player_ruleset, 1
        )
        assert result_3p_1st["calculation"]["provisionalRawScore"] == 50000

        # 2位: 35000 + 0 = 35000点
        result_3p_2nd = PointCalculator.calculate_provisional_points(
            self.three_player_ruleset, 2
        )
        assert result_3p_2nd["calculation"]["provisionalRawScore"] == 35000

        # 3位: 35000 - 15000 = 20000点
        result_3p_3rd = PointCalculator.calculate_provisional_points(
            self.three_player_ruleset, 3
        )
        assert result_3p_3rd["calculation"]["provisionalRawScore"] == 20000

    def test_provisional_score_calculation_formula(self):
        """仮スコア計算の数式が正しく生成されることを確認"""
        result = PointCalculator.calculate_provisional_points(
            self.mleague_ruleset, 1
        )

        expected_formula = "(40000 - 30000) / 1000 + 30 + 20 = 60.0"
        assert result["calculation"]["formula"] == expected_formula

    def test_provisional_score_with_different_starting_points(self):
        """異なる開始点での仮スコア計算を確認"""
        # 30000点スタートのルールセット
        custom_ruleset = Ruleset(
            rulesetId="test-custom",
            ruleName="カスタムルール",
            gameMode="four",
            startingPoints=30000,
            basePoints=35000,
            uma=[40, 20, -20, -40],
            oka=25,
            createdBy="test-user",
            isGlobal=True,
        )

        # 1位: 30000 + 15000 = 45000点
        result_1st = PointCalculator.calculate_provisional_points(
            custom_ruleset, 1
        )
        assert result_1st["calculation"]["provisionalRawScore"] == 45000
        # 基本計算: (45000 - 35000) / 1000 = 10.0pt
        # ウマ: 40pt, オカ: 25pt
        # 合計: 10.0 + 40 + 25 = 75.0pt
        assert result_1st["finalPoints"] == 75.0

        # 4位: 30000 - 15000 = 15000点
        result_4th = PointCalculator.calculate_provisional_points(
            custom_ruleset, 4
        )
        assert result_4th["calculation"]["provisionalRawScore"] == 15000
        # 基本計算: (15000 - 35000) / 1000 = -20.0pt
        # ウマ: -40pt, オカ: 0pt
        # 合計: -20.0 + (-40) + 0 = -60.0pt
        assert result_4th["finalPoints"] == -60.0