"""
対局データモデル
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime
import uuid
from .base import BaseEntity


class MatchRequest(BaseModel):
    """対局登録リクエスト（個人成績用）"""

    date: str = Field(..., description="対局日時（ISO形式）")
    gameMode: Literal["three", "four"] = Field(..., description="ゲームモード")
    entryMethod: Literal[
        "rank_plus_points", "rank_plus_raw", "provisional_rank_only"
    ] = Field(..., description="入力方式")
    rulesetId: Optional[str] = Field(None, description="ルールセットID")
    rank: int = Field(..., ge=1, le=4, description="自分の順位（1-4）")
    finalPoints: Optional[float] = Field(None, description="最終ポイント")
    rawScore: Optional[int] = Field(None, description="素点")
    chipCount: Optional[int] = Field(None, description="チップ数")
    venueId: Optional[str] = Field(None, description="会場ID")
    memo: Optional[str] = Field(None, description="メモ")

    @validator("rank")
    def validate_rank(cls, v, values):
        """順位のバリデーション"""
        game_mode = values.get("gameMode")
        max_rank = 3 if game_mode == "three" else 4

        if v > max_rank:
            raise ValueError(
                f"{game_mode}麻雀では順位は{max_rank}以下である必要があります"
            )

        return v

    @validator("finalPoints", always=True)
    def validate_final_points(cls, v, values):
        """最終ポイントのバリデーション"""
        entry_method = values.get("entryMethod")

        if entry_method == "rank_plus_points" and v is None:
            raise ValueError("順位+最終スコア方式では最終ポイントが必要です")

        return v

    @validator("rawScore", always=True)
    def validate_raw_score(cls, v, values):
        """素点のバリデーション"""
        entry_method = values.get("entryMethod")

        if entry_method == "rank_plus_raw" and v is None:
            raise ValueError("順位+素点方式では素点が必要です")

        return v


class Match(BaseEntity):
    """対局データモデル（個人成績用）"""

    matchId: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="対局ID"
    )
    userId: str = Field(..., description="ユーザーID")
    date: str = Field(..., description="対局日時（ISO形式）")
    gameMode: Literal["three", "four"] = Field(..., description="ゲームモード")
    entryMethod: Literal[
        "rank_plus_points", "rank_plus_raw", "provisional_rank_only"
    ] = Field(..., description="入力方式")
    rulesetId: Optional[str] = Field(None, description="ルールセットID")
    rank: int = Field(..., ge=1, le=4, description="自分の順位（1-4）")
    finalPoints: Optional[float] = Field(None, description="最終ポイント")
    rawScore: Optional[int] = Field(None, description="素点")
    chipCount: Optional[int] = Field(None, description="チップ数")
    venueId: Optional[str] = Field(None, description="会場ID")
    memo: Optional[str] = Field(None, description="メモ")

    def __init__(self, **data):
        # entityTypeを自動設定
        data["entityType"] = "MATCH"

        # matchIdが未設定の場合は新規生成
        if "matchId" not in data:
            data["matchId"] = str(uuid.uuid4())

        # PK、SKを自動設定
        if "userId" in data:
            data["PK"] = f"USER#{data['userId']}"
            data["SK"] = f"MATCH#{data['matchId']}"

        super().__init__(**data)

    def get_pk(self) -> str:
        """パーティションキーを取得"""
        return f"USER#{self.userId}"

    def get_sk(self) -> str:
        """ソートキーを取得"""
        return f"MATCH#{self.matchId}"

    @classmethod
    def from_request(cls, request: MatchRequest, user_id: str) -> "Match":
        """リクエストから対局データを作成"""
        return cls(
            userId=user_id,
            date=request.date,
            gameMode=request.gameMode,
            entryMethod=request.entryMethod,
            rulesetId=request.rulesetId,
            rank=request.rank,
            finalPoints=request.finalPoints,
            rawScore=request.rawScore,
            chipCount=request.chipCount,
            venueId=request.venueId,
            memo=request.memo,
        )

    def to_api_response(self) -> dict:
        """API レスポンス用の辞書に変換"""
        return {
            "matchId": self.matchId,
            "date": self.date,
            "gameMode": self.gameMode,
            "entryMethod": self.entryMethod,
            "rulesetId": self.rulesetId,
            "rank": self.rank,
            "finalPoints": self.finalPoints,
            "rawScore": self.rawScore,
            "chipCount": self.chipCount,
            "venueId": self.venueId,
            "memo": self.memo,
        }


class MatchListResponse(BaseModel):
    """対局一覧レスポンス"""

    matches: list[dict] = Field(..., description="対局一覧")
    total: int = Field(..., description="総件数")
