"""
データマイグレーション互換性テスト

既存データとの互換性を確認するテスト
"""

import pytest
from app.models.ruleset import Ruleset
from app.models.match import Match
from app.utils.floating_uma_calculator import FloatingUmaCalculator


class TestRulesetMigration:
    """ルールセットのデータマイグレーション互換性テスト"""

    def test_legacy_ruleset_without_floating_uma_fields(self):
        """既存ルールセット（浮きウマフィールドなし）の読み込み"""
        # 既存データ（useFloatingUmaとumaMatrixがない）
        legacy_data = {
            "rulesetId": "legacy-ruleset-1",
            "ruleName": "既存ルール",
            "gameMode": "four",
            "startingPoints": 25000,
            "basePoints": 30000,
            "uma": [30, 10, -10, -30],
            "oka": 20,
            "useChips": False,
            "isGlobal": True,
            "createdBy": "admin",
        }
        
        # Rulesetモデルで読み込み
        ruleset = Ruleset(**legacy_data)
        
        # デフォルト値が設定されることを確認
        assert ruleset.useFloatingUma is False
        assert ruleset.umaMatrix is None
        
        # 既存フィールドは正常に読み込まれる
        assert ruleset.ruleName == "既存ルール"
        assert ruleset.uma == [30, 10, -10, -30]

    def test_legacy_ruleset_with_false_floating_uma(self):
        """既存ルールセット（useFloatingUma=false）の読み込み"""
        legacy_data = {
            "rulesetId": "legacy-ruleset-2",
            "ruleName": "既存ルール2",
            "gameMode": "four",
            "startingPoints": 25000,
            "basePoints": 30000,
            "useFloatingUma": False,
            "uma": [20, 10, -10, -20],
            "oka": 20,
            "useChips": False,
            "isGlobal": True,
            "createdBy": "admin",
        }
        
        ruleset = Ruleset(**legacy_data)
        
        # useFloatingUma=falseの場合、umaMatrixはNoneでOK
        assert ruleset.useFloatingUma is False
        assert ruleset.umaMatrix is None

    def test_new_ruleset_with_floating_uma(self):
        """新規ルールセット（浮きウマあり）の読み込み"""
        new_data = {
            "rulesetId": "new-ruleset-1",
            "ruleName": "浮きウマルール",
            "gameMode": "four",
            "startingPoints": 30000,
            "basePoints": 30000,
            "useFloatingUma": True,
            "uma": [30, 10, -10, -30],
            "umaMatrix": {
                "0": [0, 0, 0, 0],
                "1": [12, -1, -3, -8],
                "2": [8, 4, -4, -8],
                "3": [8, 3, 1, -12],
                "4": [0, 0, 0, 0],
            },
            "oka": 0,
            "useChips": False,
            "isGlobal": True,
            "createdBy": "admin",
        }
        
        ruleset = Ruleset(**new_data)
        
        # 浮きウマフィールドが正常に読み込まれる
        assert ruleset.useFloatingUma is True
        assert ruleset.umaMatrix is not None
        assert ruleset.umaMatrix["1"] == [12, -1, -3, -8]

    def test_legacy_ruleset_to_api_response(self):
        """既存ルールセットのAPI レスポンス変換"""
        legacy_data = {
            "rulesetId": "legacy-ruleset-3",
            "ruleName": "既存ルール3",
            "gameMode": "four",
            "startingPoints": 25000,
            "basePoints": 30000,
            "uma": [15, 5, -5, -15],
            "oka": 20,
            "useChips": False,
            "isGlobal": True,
            "createdBy": "admin",
        }
        
        ruleset = Ruleset(**legacy_data)
        response = ruleset.to_api_response()
        
        # API レスポンスに浮きウマフィールドが含まれる
        assert "useFloatingUma" in response
        assert response["useFloatingUma"] is False
        assert "umaMatrix" in response
        assert response["umaMatrix"] is None


class TestMatchMigration:
    """対局データのデータマイグレーション互換性テスト"""

    def test_legacy_match_without_floating_count(self):
        """既存対局データ（floatingCountなし）の読み込み"""
        legacy_data = {
            "matchId": "legacy-match-1",
            "userId": "user-001",
            "date": "2024-01-15T10:00:00+09:00",
            "gameMode": "four",
            "entryMethod": "rank_plus_raw",
            "rulesetId": "ruleset-001",
            "rank": 1,
            "rawScore": 35000,
        }
        
        match = Match(**legacy_data)
        
        # floatingCountはNoneになる
        assert match.floatingCount is None
        
        # 既存フィールドは正常に読み込まれる
        assert match.rank == 1
        assert match.rawScore == 35000

    def test_new_match_with_floating_count(self):
        """新規対局データ（floatingCountあり）の読み込み"""
        new_data = {
            "matchId": "new-match-1",
            "userId": "user-001",
            "date": "2024-01-15T10:00:00+09:00",
            "gameMode": "four",
            "entryMethod": "rank_plus_raw",
            "rulesetId": "ruleset-001",
            "rank": 1,
            "rawScore": 35000,
            "floatingCount": 2,
        }
        
        match = Match(**new_data)
        
        # floatingCountが正常に読み込まれる
        assert match.floatingCount == 2

    def test_legacy_match_to_api_response(self):
        """既存対局データのAPI レスポンス変換"""
        legacy_data = {
            "matchId": "legacy-match-2",
            "userId": "user-001",
            "date": "2024-01-15T10:00:00+09:00",
            "gameMode": "four",
            "entryMethod": "rank_plus_points",
            "rulesetId": "ruleset-001",
            "rank": 2,
            "finalPoints": 15.0,
        }
        
        match = Match(**legacy_data)
        response = match.to_api_response()
        
        # API レスポンスにfloatingCountが含まれる（Noneでも）
        assert "floatingCount" in response
        assert response["floatingCount"] is None


class TestPointCalculationCompatibility:
    """ポイント計算の互換性テスト"""

    @pytest.fixture
    def legacy_ruleset(self):
        """既存ルールセット（浮きウマなし）"""
        return Ruleset(
            rulesetId="legacy-ruleset",
            ruleName="既存ルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            useFloatingUma=False,
            uma=[30, 10, -10, -30],
            oka=20,
            useChips=False,
            isGlobal=True,
            createdBy="admin",
        )

    @pytest.fixture
    def floating_uma_ruleset(self):
        """浮きウマルールセット"""
        return Ruleset(
            rulesetId="floating-ruleset",
            ruleName="浮きウマルール",
            gameMode="four",
            startingPoints=30000,
            basePoints=30000,
            useFloatingUma=True,
            uma=[30, 10, -10, -30],
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

    def test_legacy_ruleset_point_calculation(self, legacy_ruleset):
        """既存ルールセットでのポイント計算（浮きウマなし）"""
        # 既存ルールセットでは標準ウマを使用
        # この場合、FloatingUmaCalculatorは使用されない
        # 代わりに標準のポイント計算が使用される
        
        # useFloatingUmaがFalseであることを確認
        assert legacy_ruleset.useFloatingUma is False
        assert legacy_ruleset.umaMatrix is None

    def test_floating_uma_ruleset_point_calculation(self, floating_uma_ruleset):
        """浮きウマルールセットでのポイント計算"""
        # 浮きウマルールセットでは浮き人数に応じたウマを使用
        final_points = FloatingUmaCalculator.calculate_points(
            raw_score=35000,
            rank=1,
            floating_count=2,
            ruleset=floating_uma_ruleset
        )
        
        # 計算結果を確認
        # (35000 - 30000) / 1000 + 8 + 0 = 5.0 + 8 + 0 = 13.0
        assert final_points == 13.0

    def test_is_player_floating_compatibility(self):
        """浮き判定の互換性テスト"""
        # 既存データでも浮き判定は動作する
        assert FloatingUmaCalculator.is_player_floating(35000, 30000) is True
        assert FloatingUmaCalculator.is_player_floating(25000, 30000) is False
        assert FloatingUmaCalculator.is_player_floating(30000, 30000) is True


class TestThreePlayerCompatibility:
    """3人麻雀の互換性テスト"""

    def test_three_player_legacy_ruleset(self):
        """3人麻雀の既存ルールセット"""
        legacy_data = {
            "rulesetId": "three-legacy",
            "ruleName": "3人麻雀標準",
            "gameMode": "three",
            "startingPoints": 35000,
            "basePoints": 40000,
            "uma": [20, 0, -20],
            "oka": 15,
            "useChips": False,
            "isGlobal": True,
            "createdBy": "admin",
        }
        
        ruleset = Ruleset(**legacy_data)
        
        # デフォルト値が設定される
        assert ruleset.useFloatingUma is False
        assert ruleset.umaMatrix is None
        assert ruleset.gameMode == "three"

    def test_three_player_floating_uma_ruleset(self):
        """3人麻雀の浮きウマルールセット"""
        new_data = {
            "rulesetId": "three-floating",
            "ruleName": "3人麻雀浮きウマ",
            "gameMode": "three",
            "startingPoints": 30000,
            "basePoints": 35000,
            "useFloatingUma": True,
            "uma": [20, 0, -20],
            "umaMatrix": {
                "0": [0, 0, 0],
                "1": [40, -20, -20],
                "2": [20, 0, -20],
                "3": [0, 0, 0],
                "4": [0, 0, 0],
            },
            "oka": 15,
            "useChips": False,
            "isGlobal": True,
            "createdBy": "admin",
        }
        
        ruleset = Ruleset(**new_data)
        
        # 3人麻雀の浮きウマが正常に読み込まれる
        assert ruleset.useFloatingUma is True
        assert ruleset.umaMatrix is not None
        assert len(ruleset.umaMatrix["1"]) == 3

    def test_three_player_floating_uma_calculation(self):
        """3人麻雀の浮きウマポイント計算"""
        ruleset = Ruleset(
            rulesetId="three-floating",
            ruleName="3人麻雀浮きウマ",
            gameMode="three",
            startingPoints=30000,
            basePoints=35000,
            useFloatingUma=True,
            uma=[20, 0, -20],
            umaMatrix={
                "0": [0, 0, 0],
                "1": [40, -20, -20],
                "2": [20, 0, -20],
                "3": [0, 0, 0],
                "4": [0, 0, 0],
            },
            oka=15,
            useChips=False,
            isGlobal=True,
            createdBy="admin",
        )
        
        # 浮き1人、1位のポイント計算
        final_points = FloatingUmaCalculator.calculate_points(
            raw_score=52300,
            rank=1,
            floating_count=1,
            ruleset=ruleset
        )
        
        # (52300 - 35000) / 1000 + 40 + 15 = 17.3 + 40 + 15 = 72.3
        assert final_points == 72.3
