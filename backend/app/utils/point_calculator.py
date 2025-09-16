"""
ポイント計算ユーティリティ
"""

from typing import Dict, List, Any
from ..models.ruleset import Ruleset


class PointCalculator:
    """ポイント計算クラス"""
    
    @staticmethod
    def calculate_final_points(
        ruleset: Ruleset,
        rank: int,
        raw_score: int
    ) -> Dict[str, Any]:
        """
        最終ポイントを計算する
        
        Args:
            ruleset: ルールセット
            rank: 順位（1-4）
            raw_score: 素点
            
        Returns:
            計算結果辞書（finalPoints, calculation詳細）
        """
        # 基本計算: (素点 - 基準点) / 1000
        base_calculation = (raw_score - ruleset.basePoints) / 1000
        
        # ウマの取得
        if ruleset.useFloatingUma and ruleset.umaMatrix:
            # 浮きウマルール（将来実装）
            # 現在は標準ウマを使用
            uma_points = ruleset.uma[rank - 1]
        else:
            # 標準ウマルール
            uma_points = ruleset.uma[rank - 1]
        
        # オカの計算（1位のみ）
        oka_points = ruleset.oka if rank == 1 else 0
        
        # 最終ポイント計算
        final_points = base_calculation + uma_points + oka_points
        
        # 小数点第1位まで丸める
        final_points = round(final_points, 1)
        
        # 計算詳細
        calculation = {
            "rawScore": raw_score,
            "basePoints": ruleset.basePoints,
            "baseCalculation": round(base_calculation, 1),
            "rank": rank,
            "umaPoints": uma_points,
            "okaPoints": oka_points,
            "finalPoints": final_points,
            "formula": f"({raw_score} - {ruleset.basePoints}) / 1000 + {uma_points} + {oka_points} = {final_points}"
        }
        
        return {
            "finalPoints": final_points,
            "calculation": calculation
        }
    
    @staticmethod
    def calculate_provisional_points(
        ruleset: Ruleset,
        rank: int
    ) -> Dict[str, Any]:
        """
        仮スコア（順位のみ）からポイントを計算する
        
        Args:
            ruleset: ルールセット
            rank: 順位（1-4）
            
        Returns:
            計算結果辞書
        """
        # 仮の素点を設定（基準点ベース）
        if rank == 1:
            provisional_raw_score = ruleset.basePoints + 15000  # +15000点
        elif rank == 2:
            provisional_raw_score = ruleset.basePoints + 5000   # +5000点
        elif rank == 3:
            provisional_raw_score = ruleset.basePoints - 5000   # -5000点
        else:  # rank == 4
            provisional_raw_score = ruleset.basePoints - 15000  # -15000点
        
        # 通常の計算を実行
        result = PointCalculator.calculate_final_points(
            ruleset, rank, provisional_raw_score
        )
        
        # 仮スコアであることを明記
        result["calculation"]["isProvisional"] = True
        result["calculation"]["provisionalRawScore"] = provisional_raw_score
        
        return result
    
    @staticmethod
    def suggest_uma_from_points(
        starting_points: int,
        base_points: int,
        game_mode: str
    ) -> List[int]:
        """
        開始点と基準点からウマを自動提案する
        
        Args:
            starting_points: 開始点
            base_points: 基準点
            game_mode: ゲームモード（three/four）
            
        Returns:
            提案されたウマ配列
        """
        point_diff = base_points - starting_points
        
        if game_mode == "three":
            # 3人麻雀の一般的なウマパターン
            if point_diff == 5000:  # 35000点持ち40000点返し
                return [20, 0, -20]
            elif point_diff == 10000:  # 25000点持ち35000点返し
                return [30, 0, -30]
            else:
                # デフォルト
                return [20, 0, -20]
        else:  # four
            # 4人麻雀の一般的なウマパターン
            if point_diff == 5000:  # 25000点持ち30000点返し（Mリーグ）
                return [30, 10, -10, -30]
            elif point_diff == 10000:  # 25000点持ち35000点返し
                return [40, 20, -20, -40]
            else:
                # デフォルト（Mリーグルール）
                return [30, 10, -10, -30]
    
    @staticmethod
    def calculate_oka_from_points(
        starting_points: int,
        base_points: int,
        game_mode: str
    ) -> int:
        """
        開始点と基準点からオカを自動計算する
        
        Args:
            starting_points: 開始点
            base_points: 基準点
            game_mode: ゲームモード（three/four）
            
        Returns:
            オカポイント
        """
        point_diff = base_points - starting_points
        player_count = 3 if game_mode == "three" else 4
        
        # オカ = (基準点 - 開始点) × 人数 / 1000
        oka = (point_diff * player_count) // 1000
        
        return oka
    
    @staticmethod
    def get_common_rule_templates() -> List[Dict[str, Any]]:
        """
        よく使われるルールテンプレートを取得する
        
        Returns:
            ルールテンプレート一覧
        """
        return [
            {
                "name": "Mリーグルール（4人麻雀）",
                "gameMode": "four",
                "startingPoints": 25000,
                "basePoints": 30000,
                "uma": [30, 10, -10, -30],
                "oka": 20,
                "description": "プロリーグで使用される標準ルール"
            },
            {
                "name": "フリー雀荘標準（4人麻雀）",
                "gameMode": "four",
                "startingPoints": 25000,
                "basePoints": 30000,
                "uma": [20, 10, -10, -20],
                "oka": 20,
                "description": "一般的なフリー雀荘ルール"
            },
            {
                "name": "競技麻雀（4人麻雀）",
                "gameMode": "four",
                "startingPoints": 25000,
                "basePoints": 30000,
                "uma": [15, 5, -5, -15],
                "oka": 20,
                "description": "競技麻雀でよく使われるルール"
            },
            {
                "name": "3人麻雀標準",
                "gameMode": "three",
                "startingPoints": 35000,
                "basePoints": 40000,
                "uma": [20, 0, -20],
                "oka": 15,
                "description": "3人麻雀の一般的なルール"
            },
            {
                "name": "3人麻雀（高レート）",
                "gameMode": "three",
                "startingPoints": 25000,
                "basePoints": 35000,
                "uma": [30, 0, -30],
                "oka": 30,
                "description": "高レート3人麻雀ルール"
            }
        ]
    
    @staticmethod
    def get_rule_options() -> Dict[str, Any]:
        """
        ルール選択肢を取得する（将来のUI用）
        
        Returns:
            ルール選択肢辞書
        """
        return {
            "basicRuleOptions": {
                # 将来実装予定
                "redTiles": {"type": "boolean", "default": True, "description": "赤牌あり/なし"},
                "openTanyao": {"type": "boolean", "default": True, "description": "喰いタンあり/なし"},
                "postAttachment": {"type": "boolean", "default": True, "description": "後付けあり/なし"},
                "winStop": {"type": "boolean", "default": False, "description": "あがり止めあり/なし"},
            },
            "gameplayRuleOptions": {
                # 将来実装予定
                "abortiveDraw": {
                    "type": "select",
                    "options": ["none", "ninekind", "fourwind", "fourkan", "fourriichi"],
                    "default": "none",
                    "description": "途中流局"
                },
                "doubleYakuman": {"type": "boolean", "default": False, "description": "ダブル役満あり/なし"},
                "doubleRon": {"type": "boolean", "default": True, "description": "ダブロンあり/なし"},
            },
            "commonUmaPatterns": {
                "three": {
                    "標準": [20, 0, -20],
                    "高レート": [30, 0, -30],
                    "低レート": [10, 0, -10],
                },
                "four": {
                    "Mリーグ": [30, 10, -10, -30],
                    "フリー雀荘": [20, 10, -10, -20],
                    "競技麻雀": [15, 5, -5, -15],
                    "高レート": [40, 20, -20, -40],
                }
            }
        }