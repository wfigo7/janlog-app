"""
ルールセット関連のテスト
"""

import pytest
from app.models.ruleset import RulesetRequest, Ruleset
from app.utils.point_calculator import PointCalculator


class TestRulesetModel:
    """ルールセットモデルのテスト"""
    
    def test_create_ruleset_from_request(self):
        """リクエストからルールセット作成のテスト"""
        request = RulesetRequest(
            ruleName="テストルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            useFloatingUma=False,
            uma=[30, 10, -10, -30],
            oka=20,
            useChips=False,
            memo="テスト用ルール"
        )
        
        ruleset = Ruleset.from_request(request, "test-user", False)
        
        assert ruleset.ruleName == "テストルール"
        assert ruleset.gameMode == "four"
        assert ruleset.startingPoints == 25000
        assert ruleset.basePoints == 30000
        assert ruleset.uma == [30, 10, -10, -30]
        assert ruleset.oka == 20
        assert ruleset.useChips == False
        assert ruleset.isGlobal == False
        assert ruleset.createdBy == "test-user"
    
    def test_create_ruleset_with_chips(self):
        """チップありルールセット作成のテスト"""
        request = RulesetRequest(
            ruleName="チップありルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            useFloatingUma=False,
            uma=[30, 10, -10, -30],
            oka=20,
            useChips=True,
            memo="チップありのテスト用ルール"
        )
        
        ruleset = Ruleset.from_request(request, "test-user", False)
        
        assert ruleset.useChips == True
        assert ruleset.ruleName == "チップありルール"
    
    def test_uma_validation_three_players(self):
        """3人麻雀のウマバリデーションテスト"""
        with pytest.raises(ValueError, match="3人麻雀のウマ配列は3要素である必要があります"):
            RulesetRequest(
                ruleName="テストルール",
                gameMode="three",
                startingPoints=35000,
                basePoints=40000,
                uma=[20, 0, -10, -10],  # 4要素（エラー）
                oka=15,
                useChips=False
            )
    
    def test_uma_validation_four_players(self):
        """4人麻雀のウマバリデーションテスト"""
        with pytest.raises(ValueError, match="4人麻雀のウマ配列は4要素である必要があります"):
            RulesetRequest(
                ruleName="テストルール",
                gameMode="four",
                startingPoints=25000,
                basePoints=30000,
                uma=[30, 10, -40],  # 3要素（エラー）
                oka=20,
                useChips=False
            )
    
    def test_uma_sum_validation(self):
        """ウマ合計のバリデーションテスト"""
        with pytest.raises(ValueError, match="ウマ配列の合計は0である必要があります"):
            RulesetRequest(
                ruleName="テストルール",
                gameMode="four",
                startingPoints=25000,
                basePoints=30000,
                uma=[30, 10, -10, -20],  # 合計が10（エラー）
                oka=20,
                useChips=False
            )
    
    def test_base_points_validation(self):
        """基準点のバリデーションテスト"""
        with pytest.raises(ValueError, match="基準点は開始点以上である必要があります"):
            RulesetRequest(
                ruleName="テストルール",
                gameMode="four",
                startingPoints=30000,
                basePoints=25000,  # 開始点より小さい（エラー）
                uma=[30, 10, -10, -30],
                oka=20,
                useChips=False
            )


class TestPointCalculator:
    """ポイント計算のテスト"""
    
    def test_calculate_final_points_mleague_rule(self):
        """Mリーグルールでのポイント計算テスト"""
        # Mリーグルール
        ruleset = Ruleset(
            rulesetId="test-rule",
            ruleName="Mリーグルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            uma=[30, 10, -10, -30],
            oka=20,
            useChips=False,
            createdBy="test-user"
        )
        
        calculator = PointCalculator()
        
        # 1位: 45100点の場合
        result = calculator.calculate_final_points(ruleset, 1, 45100)
        expected = (45100 - 30000) / 1000 + 30 + 20  # 15.1 + 30 + 20 = 65.1
        assert result["finalPoints"] == 65.1
        assert result["calculation"]["umaPoints"] == 30
        assert result["calculation"]["okaPoints"] == 20
        
        # 2位: 32400点の場合
        result = calculator.calculate_final_points(ruleset, 2, 32400)
        expected = (32400 - 30000) / 1000 + 10 + 0  # 2.4 + 10 + 0 = 12.4
        assert result["finalPoints"] == 12.4
        assert result["calculation"]["umaPoints"] == 10
        assert result["calculation"]["okaPoints"] == 0
        
        # 4位: 7800点の場合
        result = calculator.calculate_final_points(ruleset, 4, 7800)
        expected = (7800 - 30000) / 1000 + (-30) + 0  # -22.2 + (-30) + 0 = -52.2
        assert result["finalPoints"] == -52.2
        assert result["calculation"]["umaPoints"] == -30
        assert result["calculation"]["okaPoints"] == 0
    
    def test_calculate_final_points_three_players(self):
        """3人麻雀でのポイント計算テスト"""
        # 3人麻雀ルール
        ruleset = Ruleset(
            rulesetId="test-rule-3",
            ruleName="3人麻雀ルール",
            gameMode="three",
            startingPoints=35000,
            basePoints=40000,
            uma=[20, 0, -20],
            oka=15,
            useChips=False,
            createdBy="test-user"
        )
        
        calculator = PointCalculator()
        
        # 1位: 52300点の場合
        result = calculator.calculate_final_points(ruleset, 1, 52300)
        expected = (52300 - 40000) / 1000 + 20 + 15  # 12.3 + 20 + 15 = 47.3
        assert result["finalPoints"] == 47.3
        
        # 3位: 13800点の場合
        result = calculator.calculate_final_points(ruleset, 3, 13800)
        expected = (13800 - 40000) / 1000 + (-20) + 0  # -26.2 + (-20) + 0 = -46.2
        assert result["finalPoints"] == -46.2
    
    def test_suggest_uma_from_points(self):
        """開始点・基準点からのウマ自動提案テスト"""
        calculator = PointCalculator()
        
        # Mリーグルール（25000点持ち30000点返し）
        uma = calculator.suggest_uma_from_points(25000, 30000, "four")
        assert uma == [30, 10, -10, -30]
        
        # 3人麻雀標準（35000点持ち40000点返し）
        uma = calculator.suggest_uma_from_points(35000, 40000, "three")
        assert uma == [20, 0, -20]
    
    def test_calculate_oka_from_points(self):
        """開始点・基準点からのオカ自動計算テスト"""
        calculator = PointCalculator()
        
        # 4人麻雀: (30000-25000) × 4 / 1000 = 20
        oka = calculator.calculate_oka_from_points(25000, 30000, "four")
        assert oka == 20
        
        # 3人麻雀: (40000-35000) × 3 / 1000 = 15
        oka = calculator.calculate_oka_from_points(35000, 40000, "three")
        assert oka == 15
    
    def test_get_common_rule_templates(self):
        """共通ルールテンプレート取得テスト"""
        calculator = PointCalculator()
        templates = calculator.get_common_rule_templates()
        
        assert len(templates) > 0
        
        # Mリーグルールが含まれていることを確認
        mleague_rule = next((t for t in templates if "Mリーグ" in t["name"]), None)
        assert mleague_rule is not None
        assert mleague_rule["gameMode"] == "four"
        assert mleague_rule["startingPoints"] == 25000
        assert mleague_rule["basePoints"] == 30000
        assert mleague_rule["uma"] == [30, 10, -10, -30]
        assert mleague_rule["oka"] == 20


if __name__ == "__main__":
    pytest.main([__file__])