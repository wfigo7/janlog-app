"""
浮きウマ計算機

浮きウマルールを使用したポイント計算を行うユーティリティクラス
"""

from typing import List, Dict, Optional


class FloatingUmaCalculator:
    """浮きウマを使用したポイント計算クラス"""

    @staticmethod
    def calculate_points(
        raw_score: int,
        rank: int,
        floating_count: int,
        ruleset: "Ruleset"  # type: ignore
    ) -> float:
        """
        浮きウマを使用したポイント計算
        
        計算式: (素点 - 基準点) / 1000 + ウマ[順位-1] + オカ
        
        Args:
            raw_score: 素点
            rank: 順位（1-4）
            floating_count: 浮き人数
            ruleset: ルールセット
        
        Returns:
            最終ポイント（小数点第1位まで）
        """
        # 基本計算: (素点 - 基準点) / 1000
        basic_points = (raw_score - ruleset.basePoints) / 1000
        
        # 浮き人数に対応するウマ配列を取得
        uma_array = FloatingUmaCalculator.get_uma_for_floating_count(
            floating_count, ruleset.umaMatrix
        )
        uma_points = uma_array[rank - 1]
        
        # オカ（1位のみ）
        oka_points = ruleset.oka if rank == 1 else 0
        
        # 最終ポイント
        final_points = basic_points + uma_points + oka_points
        
        return round(final_points, 1)

    @staticmethod
    def get_uma_for_floating_count(
        floating_count: int,
        uma_matrix: Optional[Dict[str, List[int]]]
    ) -> List[int]:
        """
        浮き人数に対応するウマ配列を取得
        
        Args:
            floating_count: 浮き人数
            uma_matrix: 浮き人数別ウマ表
        
        Returns:
            ウマ配列
        
        Raises:
            ValueError: uma_matrixがNoneまたは該当する浮き人数が存在しない場合
        """
        if uma_matrix is None:
            raise ValueError("浮きウマ表が設定されていません")
        
        key = str(floating_count)
        if key not in uma_matrix:
            raise ValueError(f"浮き人数{floating_count}のウマ配列が存在しません")
        
        return uma_matrix[key]

    @staticmethod
    def is_player_floating(raw_score: int, base_points: int) -> bool:
        """
        プレイヤーの浮き判定
        
        Args:
            raw_score: 素点
            base_points: 基準点
        
        Returns:
            True: 浮き、False: 沈み
        """
        return raw_score >= base_points
