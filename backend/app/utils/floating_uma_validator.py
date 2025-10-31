"""
浮きウマバリデーター

浮きウマルール設定のバリデーションを行うユーティリティクラス
"""

from typing import List, Tuple, Dict


class FloatingUmaValidator:
    """浮きウマ設定のバリデーションクラス"""

    @staticmethod
    def validate_uma_matrix(
        uma_matrix: Dict[str, List[int]],
        game_mode: str,
        starting_points: int,
        base_points: int
    ) -> List[str]:
        """
        浮き人数別ウマ表のバリデーション
        
        Args:
            uma_matrix: 浮き人数別ウマ表
            game_mode: ゲームモード（"three" or "four"）
            starting_points: 開始点
            base_points: 基準点
        
        Returns:
            エラーメッセージのリスト（エラーがない場合は空リスト）
        """
        errors = []
        
        # 有効な浮き人数範囲を取得
        min_count, max_count = FloatingUmaValidator.get_valid_floating_counts(
            starting_points, base_points, game_mode
        )
        
        # 各浮き人数のウマ配列をバリデーション
        for floating_count in range(5):  # 0〜4
            key = str(floating_count)
            
            if key not in uma_matrix:
                errors.append(f"浮き人数{floating_count}のウマ配列が存在しません")
                continue
            
            uma_array = uma_matrix[key]
            
            # 使用される浮き人数の場合
            if min_count <= floating_count <= max_count:
                array_errors = FloatingUmaValidator.validate_uma_array(uma_array, game_mode)
                if array_errors:
                    errors.extend([f"浮き人数{floating_count}: {err}" for err in array_errors])
            else:
                # 使用されない浮き人数の場合は[0,0,0,0]であることを確認
                expected_length = 3 if game_mode == "three" else 4
                expected_array = [0] * expected_length
                if uma_array != expected_array:
                    errors.append(
                        f"浮き人数{floating_count}は使用されないため、"
                        f"ウマ配列は{expected_array}である必要があります"
                    )
        
        return errors

    @staticmethod
    def validate_uma_array(uma_array: List[int], game_mode: str) -> List[str]:
        """
        個別ウマ配列のバリデーション
        
        Args:
            uma_array: ウマ配列
            game_mode: ゲームモード（"three" or "four"）
        
        Returns:
            エラーメッセージのリスト（エラーがない場合は空リスト）
        """
        errors = []
        
        # 要素数チェック
        expected_length = 3 if game_mode == "three" else 4
        if len(uma_array) != expected_length:
            errors.append(
                f"ウマ配列は{expected_length}要素"
                f"（{game_mode}人麻雀）である必要があります"
            )
            return errors  # 要素数が違う場合は合計値チェックをスキップ
        
        # 合計値チェック
        total = sum(uma_array)
        if total != 0:
            errors.append(f"ウマ配列の合計は0である必要があります（現在: {total}）")
        
        return errors

    @staticmethod
    def get_valid_floating_counts(
        starting_points: int,
        base_points: int,
        game_mode: str
    ) -> Tuple[int, int]:
        """
        有効な浮き人数の範囲を取得
        
        Args:
            starting_points: 開始点
            base_points: 基準点
            game_mode: ゲームモード（"three" or "four"）
        
        Returns:
            (min_count, max_count): 最小浮き人数と最大浮き人数
        
        Raises:
            ValueError: 開始点が基準点より大きい場合
        """
        player_count = 3 if game_mode == "three" else 4
        
        if starting_points == base_points:
            # 開始点=基準点: 全員原点は「全員浮き」とみなす
            # 浮き人数は1〜player_count
            return (1, player_count)
        elif starting_points < base_points:
            # 開始点<基準点: 全員沈みはあり、全員浮きは存在しない
            # 浮き人数は0〜(player_count-1)
            return (0, player_count - 1)
        else:
            # 開始点>基準点: 理論上ありえない
            raise ValueError("開始点は基準点以下である必要があります")

    @staticmethod
    def validate_floating_count(
        floating_count: int,
        starting_points: int,
        base_points: int,
        game_mode: str
    ) -> List[str]:
        """
        浮き人数の範囲バリデーション
        
        Args:
            floating_count: 浮き人数
            starting_points: 開始点
            base_points: 基準点
            game_mode: ゲームモード（"three" or "four"）
        
        Returns:
            エラーメッセージのリスト（エラーがない場合は空リスト）
        """
        errors = []
        
        try:
            min_count, max_count = FloatingUmaValidator.get_valid_floating_counts(
                starting_points, base_points, game_mode
            )
            
            if floating_count < min_count or floating_count > max_count:
                errors.append(
                    f"浮き人数は{min_count}〜{max_count}の範囲で入力してください"
                )
        except ValueError as e:
            errors.append(str(e))
        
        return errors
