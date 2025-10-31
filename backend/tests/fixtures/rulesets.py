"""
テスト用ルールセットフィクスチャ

このファイルは、対局データバリデーションのテストで使用する
ルールセットのテストデータを提供します。
"""

from typing import Dict, List, Optional
from datetime import datetime


class TestRuleset:
    """テスト用ルールセットクラス"""
    
    def __init__(
        self,
        ruleset_id: str,
        rule_name: str,
        game_mode: str,
        starting_points: int,
        base_points: int,
        use_floating_uma: bool,
        uma: List[int],
        uma_matrix: Optional[Dict[str, List[int]]],
        oka: int,
        use_chips: bool = False,
        is_global: bool = True,
        created_by: str = "system",
    ):
        self.rulesetId = ruleset_id
        self.ruleName = rule_name
        self.gameMode = game_mode
        self.startingPoints = starting_points
        self.basePoints = base_points
        self.useFloatingUma = use_floating_uma
        self.uma = uma
        self.umaMatrix = uma_matrix
        self.oka = oka
        self.useChips = use_chips
        self.isGlobal = is_global
        self.createdBy = created_by
        self.createdAt = "2024-01-01T00:00:00Z"
        self.updatedAt = "2024-01-01T00:00:00Z"
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        result = {
            "rulesetId": self.rulesetId,
            "ruleName": self.ruleName,
            "gameMode": self.gameMode,
            "startingPoints": self.startingPoints,
            "basePoints": self.basePoints,
            "useFloatingUma": self.useFloatingUma,
            "uma": self.uma,
            "oka": self.oka,
            "useChips": self.useChips,
            "isGlobal": self.isGlobal,
            "createdBy": self.createdBy,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
        }
        if self.umaMatrix is not None:
            result["umaMatrix"] = self.umaMatrix
        return result


# 固定ウマルール（3人麻雀）
# - 35000点持ち40000点返し
# - ウマ: [20, 0, -20]
# - オカ: 15
FIXED_UMA_THREE = TestRuleset(
    ruleset_id="test-fixed-three",
    rule_name="3人麻雀標準（固定ウマ）",
    game_mode="three",
    starting_points=35000,
    base_points=40000,
    use_floating_uma=False,
    uma=[20, 0, -20],
    uma_matrix=None,
    oka=15,
    use_chips=False,
)

# 固定ウマルール（4人麻雀）
# - 25000点持ち30000点返し
# - ウマ: [30, 10, -10, -30]
# - オカ: 20
FIXED_UMA_FOUR = TestRuleset(
    ruleset_id="test-fixed-four",
    rule_name="Mリーグルール（固定ウマ）",
    game_mode="four",
    starting_points=25000,
    base_points=30000,
    use_floating_uma=False,
    uma=[30, 10, -10, -30],
    uma_matrix=None,
    oka=20,
    use_chips=False,
)

# 浮きウマルール（3人麻雀）
# - 30000点持ち35000点返し
# - 浮き人数別ウマ:
#   - 0人: [0, 0, 0] (全員沈み)
#   - 1人: [40, -20, -20]
#   - 2人: [20, 0, -20]
#   - 3人: [0, 0, 0] (全員浮き)
# - オカ: 15
FLOATING_UMA_THREE = TestRuleset(
    ruleset_id="test-floating-three",
    rule_name="3人麻雀浮きウマルール",
    game_mode="three",
    starting_points=30000,
    base_points=35000,
    use_floating_uma=True,
    uma=[20, 0, -20],  # 標準ウマ（使用されない）
    uma_matrix={
        "0": [0, 0, 0],
        "1": [40, -20, -20],
        "2": [20, 0, -20],
        "3": [0, 0, 0],
    },
    oka=15,
    use_chips=False,
)

# 浮きウマルール（4人麻雀）
# - 30000点持ち30000点返し（開始点=基準点）
# - 浮き人数別ウマ:
#   - 0人: [0, 0, 0, 0] (存在しない)
#   - 1人: [12, -1, -3, -8]
#   - 2人: [8, 4, -4, -8]
#   - 3人: [8, 3, 1, -12]
#   - 4人: [0, 0, 0, 0] (全員浮き)
# - オカ: 0
FLOATING_UMA_FOUR = TestRuleset(
    ruleset_id="test-floating-four",
    rule_name="日本プロ麻雀連盟公式ルール",
    game_mode="four",
    starting_points=30000,
    base_points=30000,
    use_floating_uma=True,
    uma=[30, 10, -10, -30],  # 標準ウマ（使用されない）
    uma_matrix={
        "0": [0, 0, 0, 0],
        "1": [12, -1, -3, -8],
        "2": [8, 4, -4, -8],
        "3": [8, 3, 1, -12],
        "4": [0, 0, 0, 0],
    },
    oka=0,
    use_chips=False,
)

# 固定ウマルール（4人麻雀、開始点=基準点）
# - 25000点持ち25000点返し
# - ウマ: [30, 10, -10, -30]
# - オカ: 0
# 
# 注意: 開始点=基準点の場合、全員原点は「全員浮き」として扱われる
FIXED_UMA_FOUR_EQUAL_POINTS = TestRuleset(
    ruleset_id="test-fixed-four-equal",
    rule_name="固定ウマ（開始点=基準点）",
    game_mode="four",
    starting_points=25000,
    base_points=25000,
    use_floating_uma=False,
    uma=[30, 10, -10, -30],
    uma_matrix=None,
    oka=0,
    use_chips=False,
)

# 全てのテスト用ルールセット
ALL_TEST_RULESETS = [
    FIXED_UMA_THREE,
    FIXED_UMA_FOUR,
    FLOATING_UMA_THREE,
    FLOATING_UMA_FOUR,
    FIXED_UMA_FOUR_EQUAL_POINTS,
]

# ゲームモード別のテスト用ルールセット
TEST_RULESETS_BY_MODE = {
    "three": [FIXED_UMA_THREE, FLOATING_UMA_THREE],
    "four": [FIXED_UMA_FOUR, FLOATING_UMA_FOUR, FIXED_UMA_FOUR_EQUAL_POINTS],
}

# ウマタイプ別のテスト用ルールセット
TEST_RULESETS_BY_UMA_TYPE = {
    "fixed": [FIXED_UMA_THREE, FIXED_UMA_FOUR, FIXED_UMA_FOUR_EQUAL_POINTS],
    "floating": [FLOATING_UMA_THREE, FLOATING_UMA_FOUR],
}
