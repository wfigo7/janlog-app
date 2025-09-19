"""
ルールセットデータモデル
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Dict, List, Any
import uuid
from .base import BaseEntity


class BasicRules(BaseModel):
    """基本ルール（将来拡張用）"""
    pass  # 現在は空、将来的に赤牌、喰いタンなどを追加


class GameplayRules(BaseModel):
    """進行ルール（将来拡張用）"""
    pass  # 現在は空、将来的に途中流局、ダブロンなどを追加


class AdditionalRule(BaseModel):
    """追加ルール項目"""
    name: str = Field(..., description="ルール名")
    value: str = Field(..., description="設定値")
    enabled: bool = Field(..., description="有効/無効")


class RulesetRequest(BaseModel):
    """ルールセット作成・更新リクエスト"""
    
    ruleName: str = Field(..., description="ルール名")
    gameMode: Literal["three", "four"] = Field(..., description="ゲームモード")
    startingPoints: int = Field(..., ge=10000, le=50000, description="開始点")
    basePoints: int = Field(..., ge=10000, le=50000, description="基準点")
    useFloatingUma: bool = Field(False, description="浮きウマを使用するかどうか")
    uma: List[int] = Field(..., description="ウマ配列")
    umaMatrix: Optional[Dict[str, List[int]]] = Field(None, description="浮き人数別ウマ表")
    oka: int = Field(..., description="オカポイント")
    useChips: bool = Field(False, description="チップを使用するかどうか")
    memo: Optional[str] = Field(None, description="メモ")
    basicRules: Optional[Dict[str, Any]] = Field(None, description="基本ルール")
    gameplayRules: Optional[Dict[str, Any]] = Field(None, description="進行ルール")
    additionalRules: Optional[List[AdditionalRule]] = Field(None, description="追加ルール")

    @field_validator("uma")
    @classmethod
    def validate_uma(cls, v, info):
        """ウマ配列のバリデーション"""
        game_mode = info.data.get("gameMode")
        
        if game_mode == "three" and len(v) != 3:
            raise ValueError("3人麻雀のウマ配列は3要素である必要があります")
        elif game_mode == "four" and len(v) != 4:
            raise ValueError("4人麻雀のウマ配列は4要素である必要があります")
        
        # ウマの合計が0になることを確認
        if sum(v) != 0:
            raise ValueError("ウマ配列の合計は0である必要があります")
        
        return v

    @field_validator("basePoints")
    @classmethod
    def validate_base_points(cls, v, info):
        """基準点のバリデーション"""
        starting_points = info.data.get("startingPoints")
        
        if starting_points and v < starting_points:
            raise ValueError("基準点は開始点以上である必要があります")
        
        return v


class Ruleset(BaseEntity):
    """ルールセットデータモデル"""
    
    rulesetId: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="ルールセットID"
    )
    ruleName: str = Field(..., description="ルール名")
    gameMode: Literal["three", "four"] = Field(..., description="ゲームモード")
    
    # ポイント計算関連
    startingPoints: int = Field(..., description="開始点")
    basePoints: int = Field(..., description="基準点")
    useFloatingUma: bool = Field(False, description="浮きウマを使用するかどうか")
    uma: List[int] = Field(..., description="ウマ配列")
    umaMatrix: Optional[Dict[str, List[int]]] = Field(None, description="浮き人数別ウマ表")
    oka: int = Field(..., description="オカポイント")
    useChips: bool = Field(False, description="チップを使用するかどうか")
    
    # 階層化されたルール（将来拡張用）
    basicRules: Optional[Dict[str, Any]] = Field(None, description="基本ルール")
    gameplayRules: Optional[Dict[str, Any]] = Field(None, description="進行ルール")
    additionalRules: Optional[List[AdditionalRule]] = Field(None, description="追加ルール")
    
    memo: Optional[str] = Field(None, description="メモ")
    isGlobal: bool = Field(False, description="管理者作成の全員共通ルール")
    createdBy: str = Field(..., description="作成者ID")

    def __init__(self, **data):
        # entityTypeを自動設定
        data["entityType"] = "RULESET"
        
        # rulesetIdが未設定の場合は新規生成
        if "rulesetId" not in data:
            data["rulesetId"] = str(uuid.uuid4())
        
        # PK、SKを自動設定
        if data.get("isGlobal", False):
            data["PK"] = "GLOBAL"
        elif "createdBy" in data:
            data["PK"] = f"USER#{data['createdBy']}"
        
        if "rulesetId" in data:
            data["SK"] = f"RULESET#{data['rulesetId']}"
        
        super().__init__(**data)

    def get_pk(self) -> str:
        """パーティションキーを取得"""
        return "GLOBAL" if self.isGlobal else f"USER#{self.createdBy}"

    def get_sk(self) -> str:
        """ソートキーを取得"""
        return f"RULESET#{self.rulesetId}"

    @classmethod
    def from_request(cls, request: RulesetRequest, created_by: str, is_global: bool = False) -> "Ruleset":
        """リクエストからルールセットを作成"""
        return cls(
            ruleName=request.ruleName,
            gameMode=request.gameMode,
            startingPoints=request.startingPoints,
            basePoints=request.basePoints,
            useFloatingUma=request.useFloatingUma,
            uma=request.uma,
            umaMatrix=request.umaMatrix,
            oka=request.oka,
            useChips=request.useChips,
            memo=request.memo,
            basicRules=request.basicRules,
            gameplayRules=request.gameplayRules,
            additionalRules=request.additionalRules,
            isGlobal=is_global,
            createdBy=created_by,
        )

    def to_api_response(self) -> dict:
        """API レスポンス用の辞書に変換"""
        return {
            "rulesetId": self.rulesetId,
            "ruleName": self.ruleName,
            "gameMode": self.gameMode,
            "startingPoints": self.startingPoints,
            "basePoints": self.basePoints,
            "useFloatingUma": self.useFloatingUma,
            "uma": self.uma,
            "umaMatrix": self.umaMatrix,
            "oka": self.oka,
            "useChips": self.useChips,
            "memo": self.memo,
            "basicRules": self.basicRules,
            "gameplayRules": self.gameplayRules,
            "additionalRules": [rule.dict() for rule in self.additionalRules] if self.additionalRules else None,
            "isGlobal": self.isGlobal,
            "createdBy": self.createdBy,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
        }


class RulesetListResponse(BaseModel):
    """ルールセット一覧レスポンス"""
    
    rulesets: List[dict] = Field(..., description="ルールセット一覧")
    total: int = Field(..., description="総件数")


class PointCalculationRequest(BaseModel):
    """ポイント計算リクエスト"""
    
    rulesetId: str = Field(..., description="ルールセットID")
    rank: int = Field(..., ge=1, le=4, description="順位")
    rawScore: int = Field(..., description="素点")


class PointCalculationResponse(BaseModel):
    """ポイント計算レスポンス"""
    
    finalPoints: float = Field(..., description="最終ポイント")
    calculation: dict = Field(..., description="計算詳細")


class RuleTemplateResponse(BaseModel):
    """ルールテンプレートレスポンス"""
    
    templates: List[dict] = Field(..., description="テンプレート一覧")


class RuleOptionsResponse(BaseModel):
    """ルール選択肢レスポンス"""
    
    basicRuleOptions: Dict[str, Any] = Field(..., description="基本ルール選択肢")
    gameplayRuleOptions: Dict[str, Any] = Field(..., description="進行ルール選択肢")
    commonUmaPatterns: Dict[str, List[int]] = Field(..., description="よく使われるウマパターン")