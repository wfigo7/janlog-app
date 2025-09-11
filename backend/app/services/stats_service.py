"""
統計計算サービス
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.stats import StatsSummary, RankDistribution
from app.services.match_service import get_match_service
from app.config.settings import settings


class StatsService:
    """統計計算サービス"""

    def __init__(self):
        self.match_service = get_match_service()

    async def calculate_stats_summary(
        self,
        user_id: str,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        game_mode: Optional[str] = None,
    ) -> StatsSummary:
        """成績サマリを計算"""
        try:
            # 対局データを取得
            matches = await self.match_service.get_matches(
                user_id=user_id,
                from_date=from_date,
                to_date=to_date,
                mode=game_mode,
            )

            if not matches:
                return StatsSummary.empty()

            # 統計計算
            return self._calculate_stats_from_matches(matches, game_mode)

        except Exception as e:
            raise Exception(f"統計計算に失敗しました: {str(e)}")

    def _calculate_stats_from_matches(
        self, matches: List[Dict[str, Any]], game_mode: Optional[str]
    ) -> StatsSummary:
        """対局データから統計を計算"""
        if not matches:
            return StatsSummary.empty()

        # 基本データ収集
        total_count = len(matches)
        total_points = 0.0
        total_chips = 0
        total_rank = 0

        # 順位分布
        rank_counts = {1: 0, 2: 0, 3: 0, 4: 0}

        # 追加統計用データ
        scores = []
        ranks_sequence = []  # 連続記録計算用

        # 各対局のデータを集計
        for match in matches:
            rank = match.get("rank", 0)
            final_points = match.get("finalPoints", 0.0) or 0.0
            chip_count = match.get("chipCount", 0) or 0

            # 基本統計
            total_rank += rank
            total_points += final_points
            total_chips += chip_count

            # 順位分布
            if rank in rank_counts:
                rank_counts[rank] += 1

            # 追加統計用
            scores.append(final_points)
            ranks_sequence.append(rank)

        # 平均計算
        avg_rank = total_rank / total_count if total_count > 0 else 0.0
        avg_score = total_points / total_count if total_count > 0 else 0.0

        # 順位分布オブジェクト作成
        rank_distribution = RankDistribution(
            first=rank_counts[1],
            second=rank_counts[2],
            third=rank_counts[3],
            fourth=rank_counts[4],
        )

        # 率計算
        top_rate = (rank_counts[1] / total_count * 100) if total_count > 0 else 0.0
        second_rate = (rank_counts[2] / total_count * 100) if total_count > 0 else 0.0
        third_rate = (rank_counts[3] / total_count * 100) if total_count > 0 else 0.0

        # ラス率は3人麻雀と4人麻雀で異なる
        if game_mode == "three":
            last_rate = third_rate
        else:  # four
            last_rate = (rank_counts[4] / total_count * 100) if total_count > 0 else 0.0

        # 連続記録計算
        max_consecutive_first = self._calculate_max_consecutive(ranks_sequence, 1)
        max_consecutive_last = self._calculate_max_consecutive_last(
            ranks_sequence, game_mode
        )

        # 最高・最低得点
        max_score = max(scores) if scores else float("-inf")
        min_score = min(scores) if scores else float("inf")

        return StatsSummary(
            count=total_count,
            avgRank=avg_rank,
            avgScore=avg_score,
            totalPoints=total_points,
            chipTotal=total_chips,
            rankDistribution=rank_distribution,
            topRate=top_rate,
            secondRate=second_rate,
            thirdRate=third_rate,
            lastRate=last_rate,
            maxConsecutiveFirst=max_consecutive_first,
            maxConsecutiveLast=max_consecutive_last,
            maxScore=max_score,
            minScore=min_score,
        )

    def _calculate_max_consecutive(
        self, ranks_sequence: List[int], target_rank: int
    ) -> int:
        """指定順位の最大連続回数を計算"""
        if not ranks_sequence:
            return 0

        max_consecutive = 0
        current_consecutive = 0

        for rank in ranks_sequence:
            if rank == target_rank:
                current_consecutive += 1
                max_consecutive = max(max_consecutive, current_consecutive)
            else:
                current_consecutive = 0

        return max_consecutive

    def _calculate_max_consecutive_last(
        self, ranks_sequence: List[int], game_mode: Optional[str]
    ) -> int:
        """最下位の最大連続回数を計算"""
        if not ranks_sequence:
            return 0

        # ゲームモードに応じて最下位を決定
        if game_mode == "three":
            last_rank = 3
        else:  # four
            last_rank = 4

        return self._calculate_max_consecutive(ranks_sequence, last_rank)


# サービスインスタンスを取得する関数
_stats_service_instance = None


def get_stats_service() -> StatsService:
    """StatsServiceのシングルトンインスタンスを取得"""
    global _stats_service_instance
    if _stats_service_instance is None:
        _stats_service_instance = StatsService()
    return _stats_service_instance
