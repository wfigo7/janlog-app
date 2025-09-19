"""
詳細統計機能のテスト
"""
import pytest
from app.services.stats_service import StatsService
from app.models.stats import StatsSummary, RankDistribution


class TestDetailedStats:
    """詳細統計のテスト"""

    @pytest.mark.asyncio
    async def test_calculate_stats_with_various_ranks(self):
        """様々な順位データでの統計計算テスト"""
        stats_service = StatsService()
        
        # テストデータ: 4人麻雀で10局
        matches = [
            {"rank": 1, "finalPoints": 50.0, "chipCount": 2},
            {"rank": 2, "finalPoints": 10.0, "chipCount": 0},
            {"rank": 3, "finalPoints": -15.0, "chipCount": 0},
            {"rank": 4, "finalPoints": -45.0, "chipCount": 0},
            {"rank": 1, "finalPoints": 35.0, "chipCount": 1},
            {"rank": 2, "finalPoints": 5.0, "chipCount": 0},
            {"rank": 3, "finalPoints": -20.0, "chipCount": 0},
            {"rank": 4, "finalPoints": -20.0, "chipCount": 0},
            {"rank": 1, "finalPoints": 40.0, "chipCount": 3},
            {"rank": 3, "finalPoints": -25.0, "chipCount": 0},
        ]
        
        result = await stats_service._calculate_stats_from_matches(matches, "four", "test-user")
        
        # 基本統計の確認
        assert result.count == 10
        assert abs(result.avgRank - 2.4) < 0.01  # (1+2+3+4+1+2+3+4+1+3) / 10 = 24/10 = 2.4
        assert abs(result.totalPoints - 15.0) < 0.01  # 合計ポイント
        assert result.chipTotal == 6  # チップ合計
        
        # 順位分布の確認
        assert result.rankDistribution.first == 3  # 1位: 3回
        assert result.rankDistribution.second == 2  # 2位: 2回
        assert result.rankDistribution.third == 3  # 3位: 3回
        assert result.rankDistribution.fourth == 2  # 4位: 2回
        
        # 率統計の確認
        assert abs(result.topRate - 30.0) < 0.01  # 3/10 * 100
        assert abs(result.secondRate - 20.0) < 0.01  # 2/10 * 100
        assert abs(result.thirdRate - 30.0) < 0.01  # 3/10 * 100
        assert abs(result.lastRate - 20.0) < 0.01  # 2/10 * 100
        
        # 連続記録の確認
        assert result.maxConsecutiveFirst == 1  # 連続1位は1回
        assert result.maxConsecutiveLast == 1  # 連続ラスは1回
        
        # 最高・最低得点の確認
        assert abs(result.maxScore - 50.0) < 0.01
        assert abs(result.minScore - (-45.0)) < 0.01

    @pytest.mark.asyncio
    async def test_calculate_stats_three_player(self):
        """3人麻雀での統計計算テスト"""
        stats_service = StatsService()
        
        # テストデータ: 3人麻雀で6局
        matches = [
            {"rank": 1, "finalPoints": 40.0, "chipCount": 1},
            {"rank": 2, "finalPoints": 0.0, "chipCount": 0},
            {"rank": 3, "finalPoints": -40.0, "chipCount": 0},
            {"rank": 1, "finalPoints": 30.0, "chipCount": 0},
            {"rank": 2, "finalPoints": 5.0, "chipCount": 0},
            {"rank": 3, "finalPoints": -35.0, "chipCount": 0},
        ]
        
        result = await stats_service._calculate_stats_from_matches(matches, "three", "test-user")
        
        # 基本統計の確認
        assert result.count == 6
        assert abs(result.avgRank - 2.0) < 0.01  # (1+2+3+1+2+3) / 6 = 12/6 = 2.0
        
        # 順位分布の確認（3人麻雀では4位は0）
        assert result.rankDistribution.first == 2  # 1位: 2回
        assert result.rankDistribution.second == 2  # 2位: 2回
        assert result.rankDistribution.third == 2  # 3位: 2回
        assert result.rankDistribution.fourth == 0  # 4位: 0回
        
        # ラス率は3位率と同じ
        assert result.lastRate == result.thirdRate
        assert abs(result.lastRate - 33.33333333333333) < 0.01  # 2/6 * 100 ≈ 33.33%

    @pytest.mark.asyncio
    async def test_consecutive_records(self):
        """連続記録の計算テスト"""
        stats_service = StatsService()
        
        # 連続1位のテストデータ
        matches = [
            {"rank": 1, "finalPoints": 50.0, "chipCount": 0},
            {"rank": 1, "finalPoints": 40.0, "chipCount": 0},
            {"rank": 1, "finalPoints": 30.0, "chipCount": 0},
            {"rank": 2, "finalPoints": 10.0, "chipCount": 0},
            {"rank": 1, "finalPoints": 20.0, "chipCount": 0},
            {"rank": 4, "finalPoints": -30.0, "chipCount": 0},
            {"rank": 4, "finalPoints": -40.0, "chipCount": 0},
        ]
        
        result = await stats_service._calculate_stats_from_matches(matches, "four", "test-user")
        
        # 連続1位は3回
        assert result.maxConsecutiveFirst == 3
        # 連続ラス（4位）は2回
        assert result.maxConsecutiveLast == 2

    @pytest.mark.asyncio
    async def test_empty_matches(self):
        """空のデータでの統計計算テスト"""
        stats_service = StatsService()
        
        result = await stats_service._calculate_stats_from_matches([], "four", "test-user")
        
        # 空の統計データが返される
        assert result.count == 0
        assert result.avgRank == 0.0
        assert result.totalPoints == 0.0
        assert result.topRate == 0.0
        assert result.lastRate == 0.0
        assert result.maxConsecutiveFirst == 0
        assert result.maxConsecutiveLast == 0
        assert result.maxScore == float('-inf')
        assert result.minScore == float('inf')

    def test_api_response_format(self):
        """API レスポンス形式のテスト"""
        stats = StatsSummary(
            count=5,
            avgRank=2.4,
            avgScore=8.66,
            totalPoints=43.3,
            chipTotal=7,
            rankDistribution=RankDistribution(first=2, second=1, third=1, fourth=1),
            topRate=40.0,
            secondRate=20.0,
            thirdRate=20.0,
            lastRate=20.0,
            maxConsecutiveFirst=2,
            maxConsecutiveLast=1,
            maxScore=55.5,
            minScore=-22.2,
        )
        
        response = stats.to_api_response()
        
        # 数値の丸め処理が正しく行われているか確認
        assert response["avgRank"] == 2.4
        assert response["avgScore"] == 8.7  # 小数点第1位で四捨五入
        assert response["totalPoints"] == 43.3
        assert response["maxScore"] == 55.5
        assert response["minScore"] == -22.2
        
        # 順位分布が正しく含まれているか確認
        assert response["rankDistribution"]["first"] == 2
        assert response["rankDistribution"]["second"] == 1
        assert response["rankDistribution"]["third"] == 1
        assert response["rankDistribution"]["fourth"] == 1