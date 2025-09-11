"""
統計データモデル
"""
from typing import Dict, Any, List
from pydantic import BaseModel


class RankDistribution(BaseModel):
    """順位分布"""
    first: int = 0    # 1位回数
    second: int = 0   # 2位回数
    third: int = 0    # 3位回数
    fourth: int = 0   # 4位回数（4人麻雀のみ）


class StatsSummary(BaseModel):
    """成績サマリ"""
    # 基本統計
    count: int  # 対局数（半荘数）
    avgRank: float  # 平均順位（平均着順）
    avgScore: float  # 平均スコア（1対局あたりの平均ポイント）
    totalPoints: float  # 累積ポイント（スコア）
    chipTotal: int  # チップ合計
    
    # 順位分布
    rankDistribution: RankDistribution  # 各順位の回数と割合
    
    # 率系統計
    topRate: float  # トップ率（%）
    secondRate: float  # 2位率（%）
    thirdRate: float  # 3位率（%）
    lastRate: float  # ラス率（%）
    
    # 追加統計項目
    maxConsecutiveFirst: int  # 連続トップ記録
    maxConsecutiveLast: int   # 連続ラス記録
    maxScore: float          # 最高得点
    minScore: float          # 最低得点

    def to_api_response(self) -> Dict[str, Any]:
        """API レスポンス形式に変換"""
        return {
            # 基本統計
            "count": self.count,
            "avgRank": round(self.avgRank, 2),
            "avgScore": round(self.avgScore, 1),
            "totalPoints": round(self.totalPoints, 1),
            "chipTotal": self.chipTotal,
            
            # 順位分布
            "rankDistribution": {
                "first": self.rankDistribution.first,
                "second": self.rankDistribution.second,
                "third": self.rankDistribution.third,
                "fourth": self.rankDistribution.fourth,
            },
            
            # 率系統計
            "topRate": round(self.topRate, 1),
            "secondRate": round(self.secondRate, 1),
            "thirdRate": round(self.thirdRate, 1),
            "lastRate": round(self.lastRate, 1),
            
            # 追加統計項目
            "maxConsecutiveFirst": self.maxConsecutiveFirst,
            "maxConsecutiveLast": self.maxConsecutiveLast,
            "maxScore": round(self.maxScore, 1) if self.maxScore != float('-inf') else 0.0,
            "minScore": round(self.minScore, 1) if self.minScore != float('inf') else 0.0,
        }

    @classmethod
    def empty(cls) -> "StatsSummary":
        """空の統計データを作成"""
        return cls(
            count=0,
            avgRank=0.0,
            avgScore=0.0,
            totalPoints=0.0,
            chipTotal=0,
            rankDistribution=RankDistribution(),
            topRate=0.0,
            secondRate=0.0,
            thirdRate=0.0,
            lastRate=0.0,
            maxConsecutiveFirst=0,
            maxConsecutiveLast=0,
            maxScore=float('-inf'),
            minScore=float('inf'),
        )