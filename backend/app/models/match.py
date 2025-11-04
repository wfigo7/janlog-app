"""
対局データモデル
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Literal
from datetime import datetime
import uuid
from .base import BaseEntity

# 対局種別の型定義
MatchType = Literal["free", "set", "competition"]


class MatchRequest(BaseModel):
    """対局登録リクエスト（個人成績用）"""

    date: str = Field(..., description="対局日時（ISO形式）")
    gameMode: Literal["three", "four"] = Field(..., description="ゲームモード")
    entryMethod: Literal[
        "rank_plus_points", "rank_plus_raw", "provisional_rank_only"
    ] = Field(..., description="入力方式")
    rulesetId: Optional[str] = Field(None, description="ルールセットID")
    matchType: Optional[MatchType] = Field(None, description="対局種別（フリー/セット/競技）")
    rank: int = Field(..., ge=1, le=4, description="自分の順位（1-4）")
    finalPoints: Optional[float] = Field(None, description="最終ポイント")
    rawScore: Optional[int] = Field(None, description="素点")
    chipCount: Optional[int] = Field(None, description="チップ数")
    venueId: Optional[str] = Field(None, description="会場ID")
    venueName: Optional[str] = Field(None, description="会場名（新規入力用）")
    memo: Optional[str] = Field(None, description="メモ")
    floatingCount: Optional[int] = Field(None, ge=0, le=4, description="浮き人数（浮きウマルール使用時のみ）")

    @field_validator("date")
    @classmethod
    def validate_date(cls, v):
        """日付のバリデーション（要件10.4, 10.5, 10.6対応）"""
        if not v:
            raise ValueError("対局日を選択してください")
        
        try:
            # ISO 8601形式の日付をパース
            date_obj = datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("日付はISO形式で入力してください")

        # 現在日時を取得（今日の終わりまで許可）
        now = datetime.now(date_obj.tzinfo)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        # 未来の日付チェック（要件10.4）
        if date_obj > today_end:
            raise ValueError("未来の日付は選択できません")

        # 5年以上前の日付チェック（要件10.5）
        five_years_ago = now.replace(year=now.year - 5)
        if date_obj < five_years_ago:
            raise ValueError("5年以上前の日付は選択できません")

        return v

    @field_validator("chipCount")
    @classmethod
    def validate_chip_count(cls, v):
        """チップ数のバリデーション"""
        if v is not None and v < 0:
            raise ValueError("チップ数は0以上で入力してください")

        return v

    @model_validator(mode="after")
    def validate_match_data(self):
        """
        複数フィールドの組み合わせバリデーション
        
        注意: このバリデーションは基本的なチェックのみを行います。
        ルールセットとの整合性チェックは、APIエンドポイントで
        MatchValidator.validate()を使用して行います。
        """
        # 順位のゲームモード別バリデーション
        max_rank = 3 if self.gameMode == "three" else 4
        if self.rank > max_rank:
            raise ValueError(
                f"{self.gameMode}麻雀では順位は{max_rank}以下である必要があります"
            )

        # 入力方式別バリデーション
        if self.entryMethod == "rank_plus_points":
            if self.finalPoints is None:
                raise ValueError("順位+最終ポイント方式では最終ポイントが必要です")

            # 範囲チェック: -999.9〜999.9
            if self.finalPoints < -999.9 or self.finalPoints > 999.9:
                raise ValueError(
                    "-999.9から999.9の範囲で入力してください（小数点第1位まで）"
                )

            # 小数点第1位までかチェック
            if round(self.finalPoints, 1) != self.finalPoints:
                raise ValueError(
                    "-999.9から999.9の範囲で入力してください（小数点第1位まで）"
                )

        elif self.entryMethod == "rank_plus_raw":
            if self.rawScore is None:
                raise ValueError("順位+素点方式では素点が必要です")

            # 範囲チェック: -999900〜999900
            if self.rawScore < -999900 or self.rawScore > 999900:
                raise ValueError("6桁までの数値を入力してください（下2桁は00）")

            # 100点単位チェック
            if abs(self.rawScore) % 100 != 0:
                raise ValueError("6桁までの数値を入力してください（下2桁は00）")

        return self


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
    matchType: Optional[MatchType] = Field(None, description="対局種別（フリー/セット/競技）")
    rank: int = Field(..., ge=1, le=4, description="自分の順位（1-4）")
    finalPoints: Optional[float] = Field(None, description="最終ポイント")
    rawScore: Optional[int] = Field(None, description="素点")
    chipCount: Optional[int] = Field(None, description="チップ数")
    venueId: Optional[str] = Field(None, description="会場ID")
    venueName: Optional[str] = Field(None, description="会場名（表示用）")
    memo: Optional[str] = Field(None, description="メモ")
    floatingCount: Optional[int] = Field(None, description="浮き人数（浮きウマルール使用時のみ）")

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
            matchType=request.matchType,
            rank=request.rank,
            finalPoints=request.finalPoints,
            rawScore=request.rawScore,
            chipCount=request.chipCount,
            venueId=request.venueId,
            venueName=request.venueName,
            memo=request.memo,
            floatingCount=request.floatingCount,
        )

    def to_api_response(self) -> dict:
        """API レスポンス用の辞書に変換"""
        return {
            "matchId": self.matchId,
            "date": self.date,
            "gameMode": self.gameMode,
            "entryMethod": self.entryMethod,
            "rulesetId": self.rulesetId,
            "matchType": self.matchType,
            "rank": self.rank,
            "finalPoints": self.finalPoints,
            "rawScore": self.rawScore,
            "chipCount": self.chipCount,
            "venueId": self.venueId,
            "venueName": self.venueName,
            "memo": self.memo,
            "floatingCount": self.floatingCount,
        }


class MatchListResponse(BaseModel):
    """対局一覧レスポンス"""

    matches: list[dict] = Field(..., description="対局一覧")
    total: int = Field(..., description="総件数")
