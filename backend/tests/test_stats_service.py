"""
統計サービスのテスト
"""
import pytest
from unittest.mock import AsyncMock, patch
from app.services.stats_service import StatsService
from app.models.stats import StatsSummary, RankDistribution


class TestStatsService:
    """統計サービスのテストクラス"""

    @pytest.fixture
    def stats_service(self):
        """統計サービスのインスタンスを作成"""
        return StatsService()

    @pytest.fixture
    def sample_matches(self):
        """サンプル対局データ"""
        return [
            {
                "matchId": "match1",
                "date": "2024-01-01T10:00:00Z",
                "gameMode": "four",
                "rank": 1,
                "finalPoints": 25.5,
                "chipCount": 2,
            },
            {
                "matchId": "match2", 
                "date": "2024-01-02T10:00:00Z",
                "gameMode": "four",
                "rank": 2,
                "finalPoints": 10.0,
                "chipCount": 0,
            },
            {
                "matchId": "match3",
                "date": "2024-01-03T10:00:00Z", 
                "gameMode": "four",
                "rank": 4,
                "finalPoints": -35.5,
                "chipCount": 0,
            },
            {
                "matchId": "match4",
                "date": "2024-01-04T10:00:00Z",
                "gameMode": "four", 
                "rank": 1,
                "finalPoints": 30.0,
                "chipCount": 1,
            },
        ]

    @pytest.mark.asyncio
    async def test_calculate_stats_summary_empty(self, stats_service):
        """空のデータでの統計計算テスト"""
        with patch.object(stats_service.match_service, 'get_matches', return_value=[]):
            result = await stats_service.calculate_stats_summary("test-user", game_mode="four")
            
            assert result.count == 0
            assert result.avgRank == 0.0
            assert result.totalPoints == 0.0
            assert result.topRate == 0.0
            assert result.lastRate == 0.0

    @pytest.mark.asyncio
    async def test_calculate_stats_summary_with_data(self, stats_service, sample_matches):
        """実際のデータでの統計計算テスト"""
        with patch.object(stats_service.match_service, 'get_matches', return_value=sample_matches):
            result = await stats_service.calculate_stats_summary("test-user", game_mode="four")
            
            # 基本統計
            assert result.count == 4
            assert result.avgRank == 2.0  # (1+2+4+1)/4 = 2.0
            assert result.totalPoints == 30.0  # 25.5+10.0-35.5+30.0 = 30.0
            assert result.avgScore == 7.5  # 30.0/4 = 7.5
            assert result.chipTotal == 3  # 2+0+0+1 = 3
            
            # 順位分布
            assert result.rankDistribution.first == 2  # 1位が2回
            assert result.rankDistribution.second == 1  # 2位が1回
            assert result.rankDistribution.third == 0  # 3位が0回
            assert result.rankDistribution.fourth == 1  # 4位が1回
            
            # 率統計
            assert result.topRate == 50.0  # 2/4 * 100 = 50%
            assert result.secondRate == 25.0  # 1/4 * 100 = 25%
            assert result.thirdRate == 0.0  # 0/4 * 100 = 0%
            assert result.lastRate == 25.0  # 1/4 * 100 = 25%
            
            # 追加統計
            assert result.maxConsecutiveFirst == 1  # 連続1位は最大1回
            assert result.maxConsecutiveLast == 1  # 連続ラスは最大1回
            assert result.maxScore == 30.0  # 最高得点
            assert result.minScore == -35.5  # 最低得点

    @pytest.mark.asyncio
    async def test_calculate_stats_three_player(self, stats_service):
        """3人麻雀での統計計算テスト"""
        three_player_matches = [
            {
                "matchId": "match1",
                "date": "2024-01-01T10:00:00Z",
                "gameMode": "three",
                "rank": 1,
                "finalPoints": 20.0,
                "chipCount": 0,
            },
            {
                "matchId": "match2",
                "date": "2024-01-02T10:00:00Z",
                "gameMode": "three",
                "rank": 3,
                "finalPoints": -20.0,
                "chipCount": 0,
            },
        ]
        
        with patch.object(stats_service.match_service, 'get_matches', return_value=three_player_matches):
            result = await stats_service.calculate_stats_summary("test-user", game_mode="three")
            
            # 3人麻雀では3位がラス
            assert result.lastRate == 50.0  # 1/2 * 100 = 50%
            assert result.rankDistribution.fourth == 0  # 4位は存在しない

    def test_calculate_max_consecutive(self, stats_service):
        """連続記録計算のテスト"""
        # 連続1位のテスト
        ranks = [1, 1, 1, 2, 1, 1, 3, 1]
        result = stats_service._calculate_max_consecutive(ranks, 1)
        assert result == 3  # 最初の3連続が最大
        
        # 連続ラスのテスト
        ranks = [4, 4, 1, 4, 4, 4, 4, 2]
        result = stats_service._calculate_max_consecutive(ranks, 4)
        assert result == 4  # 中間の4連続が最大

    def test_calculate_max_consecutive_last_three_player(self, stats_service):
        """3人麻雀での連続ラス計算テスト"""
        ranks = [3, 3, 1, 3, 2]
        result = stats_service._calculate_max_consecutive_last(ranks, "three")
        assert result == 2  # 最初の2連続が最大

    def test_calculate_max_consecutive_last_four_player(self, stats_service):
        """4人麻雀での連続ラス計算テスト"""
        ranks = [4, 4, 1, 4, 4, 4, 2]
        result = stats_service._calculate_max_consecutive_last(ranks, "four")
        assert result == 3  # 中間の3連続が最大