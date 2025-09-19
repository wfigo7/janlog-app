"""
統計APIレスポンスのテスト
"""
import pytest
from app.models.stats import StatsSummary, RankDistribution


class TestStatsApiResponse:
    """統計APIレスポンスのテストクラス"""

    def test_stats_summary_to_api_response_with_chips(self):
        """チップありの統計データのAPIレスポンステスト"""
        stats = StatsSummary(
            count=10,
            avgRank=2.1,
            avgScore=5.5,
            totalPoints=55.0,
            chipTotal=15,  # チップ合計あり
            rankDistribution=RankDistribution(
                first=3,
                second=2,
                third=3,
                fourth=2
            ),
            topRate=30.0,
            secondRate=20.0,
            thirdRate=30.0,
            lastRate=20.0,
            maxConsecutiveFirst=2,
            maxConsecutiveLast=1,
            maxScore=25.5,
            minScore=-18.2
        )

        response = stats.to_api_response()

        # 基本統計
        assert response["count"] == 10
        assert response["avgRank"] == 2.1
        assert response["avgScore"] == 5.5
        assert response["totalPoints"] == 55.0
        assert response["chipTotal"] == 15  # チップ合計が含まれる

        # 順位分布
        assert response["rankDistribution"]["first"] == 3
        assert response["rankDistribution"]["second"] == 2
        assert response["rankDistribution"]["third"] == 3
        assert response["rankDistribution"]["fourth"] == 2

        # 率統計
        assert response["topRate"] == 30.0
        assert response["secondRate"] == 20.0
        assert response["thirdRate"] == 30.0
        assert response["lastRate"] == 20.0

        # 追加統計
        assert response["maxConsecutiveFirst"] == 2
        assert response["maxConsecutiveLast"] == 1
        assert response["maxScore"] == 25.5
        assert response["minScore"] == -18.2

    def test_stats_summary_to_api_response_without_chips(self):
        """チップなしの統計データのAPIレスポンステスト"""
        stats = StatsSummary(
            count=5,
            avgRank=2.4,
            avgScore=-2.1,
            totalPoints=-10.5,
            chipTotal=None,  # チップ合計なし
            rankDistribution=RankDistribution(
                first=1,
                second=1,
                third=1,
                fourth=2
            ),
            topRate=20.0,
            secondRate=20.0,
            thirdRate=20.0,
            lastRate=40.0,
            maxConsecutiveFirst=1,
            maxConsecutiveLast=2,
            maxScore=15.0,
            minScore=-25.5
        )

        response = stats.to_api_response()

        # 基本統計
        assert response["count"] == 5
        assert response["avgRank"] == 2.4
        assert response["avgScore"] == -2.1
        assert response["totalPoints"] == -10.5
        assert "chipTotal" not in response  # チップ合計は含まれない

        # その他のフィールドは正常に含まれる
        assert response["topRate"] == 20.0
        assert response["lastRate"] == 40.0

    def test_stats_summary_empty_to_api_response(self):
        """空の統計データのAPIレスポンステスト"""
        stats = StatsSummary.empty()
        response = stats.to_api_response()

        # 基本統計
        assert response["count"] == 0
        assert response["avgRank"] == 0.0
        assert response["avgScore"] == 0.0
        assert response["totalPoints"] == 0.0
        assert "chipTotal" not in response  # chipTotalはNoneなので含まれない

        # 順位分布
        assert response["rankDistribution"]["first"] == 0
        assert response["rankDistribution"]["second"] == 0
        assert response["rankDistribution"]["third"] == 0
        assert response["rankDistribution"]["fourth"] == 0

        # 率統計
        assert response["topRate"] == 0.0
        assert response["secondRate"] == 0.0
        assert response["thirdRate"] == 0.0
        assert response["lastRate"] == 0.0

        # 追加統計
        assert response["maxConsecutiveFirst"] == 0
        assert response["maxConsecutiveLast"] == 0
        assert response["maxScore"] == 0.0  # float('-inf')は0.0に変換される
        assert response["minScore"] == 0.0   # float('inf')は0.0に変換される

    def test_stats_summary_with_zero_chips(self):
        """チップ合計が0の場合のAPIレスポンステスト"""
        stats = StatsSummary(
            count=3,
            avgRank=2.0,
            avgScore=0.0,
            totalPoints=0.0,
            chipTotal=0,  # チップ合計が0
            rankDistribution=RankDistribution(
                first=1,
                second=1,
                third=1,
                fourth=0
            ),
            topRate=33.3,
            secondRate=33.3,
            thirdRate=33.3,
            lastRate=0.0,
            maxConsecutiveFirst=1,
            maxConsecutiveLast=0,
            maxScore=5.0,
            minScore=-5.0
        )

        response = stats.to_api_response()

        # チップ合計が0でも値があるので含まれる
        assert response["chipTotal"] == 0
        assert response["count"] == 3


if __name__ == "__main__":
    pytest.main([__file__])