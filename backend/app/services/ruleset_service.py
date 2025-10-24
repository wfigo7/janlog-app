"""
ルールセット管理サービス
"""

from typing import List, Optional, Dict, Any
from ..models.ruleset import (
    Ruleset, RulesetRequest, RulesetListResponse,
    PointCalculationRequest, PointCalculationResponse,
    RuleTemplateResponse, RuleOptionsResponse
)
from ..utils.dynamodb_utils import get_dynamodb_client
from ..utils.point_calculator import PointCalculator
from ..config.settings import settings


class RulesetService:
    """ルールセット管理サービス"""
    
    def __init__(self):
        self.dynamodb_client = get_dynamodb_client()
        self.table_name = settings.DYNAMODB_TABLE_NAME
        self.point_calculator = PointCalculator()
    
    async def create_ruleset(
        self,
        request: RulesetRequest,
        created_by: str,
        is_global: bool = False
    ) -> Ruleset:
        """
        ルールセットを作成する
        
        Args:
            request: ルールセット作成リクエスト
            created_by: 作成者ID
            is_global: グローバルルールかどうか
            
        Returns:
            作成されたルールセット
        """
        # ルールセットを作成
        ruleset = Ruleset.from_request(request, created_by, is_global)
        
        # DynamoDBに保存
        await self.dynamodb_client.put_item(self.table_name, ruleset.dict())
        
        return ruleset
    
    async def get_rulesets(
        self,
        user_id: str,
        include_global: bool = True
    ) -> RulesetListResponse:
        """
        ルールセット一覧を取得する
        
        Args:
            user_id: ユーザーID
            include_global: グローバルルールを含めるかどうか
            
        Returns:
            ルールセット一覧
        """
        rulesets = []
        
        # 個人ルールセットを取得
        user_pk = f"USER#{user_id}"
        user_rulesets = await self.dynamodb_client.query_items(
            table_name=self.table_name,
            key_condition_expression="PK = :pk AND begins_with(SK, :sk_prefix)",
            expression_attribute_values={
                ":pk": user_pk,
                ":sk_prefix": "RULESET#"
            }
        )
        
        for item in user_rulesets:
            if item.get("entityType") == "RULESET":
                ruleset = Ruleset(**item)
                rulesets.append(ruleset.to_api_response())
        
        # グローバルルールセットを取得
        if include_global:
            global_rulesets = await self.dynamodb_client.query_items(
                table_name=self.table_name,
                key_condition_expression="PK = :pk AND begins_with(SK, :sk_prefix)",
                expression_attribute_values={
                    ":pk": "GLOBAL",
                    ":sk_prefix": "RULESET#"
                }
            )
            
            for item in global_rulesets:
                if item.get("entityType") == "RULESET":
                    ruleset = Ruleset(**item)
                    rulesets.append(ruleset.to_api_response())
        
        return RulesetListResponse(
            rulesets=rulesets,
            total=len(rulesets)
        )
    
    async def get_ruleset(
        self,
        ruleset_id: str,
        user_id: str
    ) -> Optional[Ruleset]:
        """
        特定のルールセットを取得する
        
        Args:
            ruleset_id: ルールセットID
            user_id: ユーザーID
            
        Returns:
            ルールセット（見つからない場合はNone）
        """
        sk = f"RULESET#{ruleset_id}"
        
        # 個人ルールセットを確認
        user_pk = f"USER#{user_id}"
        item = await self.dynamodb_client.get_item(self.table_name, user_pk, sk)
        
        if item and item.get("entityType") == "RULESET":
            return Ruleset(**item)
        
        # グローバルルールセットを確認
        item = await self.dynamodb_client.get_item(self.table_name, "GLOBAL", sk)
        
        if item and item.get("entityType") == "RULESET":
            return Ruleset(**item)
        
        return None
    
    async def update_ruleset(
        self,
        ruleset_id: str,
        request: RulesetRequest,
        user_id: str
    ) -> Optional[Ruleset]:
        """
        ルールセットを更新する
        
        Args:
            ruleset_id: ルールセットID
            request: 更新リクエスト
            user_id: ユーザーID
            
        Returns:
            更新されたルールセット（見つからない場合はNone）
        """
        # 既存のルールセットを取得
        existing_ruleset = await self.get_ruleset(ruleset_id, user_id)
        
        if not existing_ruleset:
            return None
        
        # グローバルルールは作成者以外は更新不可
        if existing_ruleset.isGlobal and existing_ruleset.createdBy != user_id:
            raise ValueError("グローバルルールは作成者のみが更新できます")
        
        # 個人ルールは所有者のみ更新可能
        if not existing_ruleset.isGlobal and existing_ruleset.createdBy != user_id:
            raise ValueError("他のユーザーのルールは更新できません")
        
        # 更新データを作成
        update_data = existing_ruleset.dict()
        update_data.update({
            "ruleName": request.ruleName,
            "gameMode": request.gameMode,
            "startingPoints": request.startingPoints,
            "basePoints": request.basePoints,
            "useFloatingUma": request.useFloatingUma,
            "uma": request.uma,
            "umaMatrix": request.umaMatrix,
            "oka": request.oka,
            "useChips": request.useChips,
            "memo": request.memo,
            "basicRules": request.basicRules,
            "gameplayRules": request.gameplayRules,
            "additionalRules": request.additionalRules,
        })
        
        # 更新されたルールセットを作成
        updated_ruleset = Ruleset(**update_data)
        
        # DynamoDBに保存
        await self.dynamodb_client.put_item(self.table_name, updated_ruleset.dict())
        
        return updated_ruleset
    
    async def delete_ruleset(
        self,
        ruleset_id: str,
        user_id: str
    ) -> bool:
        """
        ルールセットを削除する
        
        Args:
            ruleset_id: ルールセットID
            user_id: ユーザーID
            
        Returns:
            削除成功かどうか
        """
        # 既存のルールセットを取得
        existing_ruleset = await self.get_ruleset(ruleset_id, user_id)
        
        if not existing_ruleset:
            return False
        
        # DynamoDBから削除
        pk = existing_ruleset.get_pk()
        sk = existing_ruleset.get_sk()
        
        return await self.dynamodb_client.delete_item(self.table_name, pk, sk)
    
    async def calculate_points(
        self,
        request: PointCalculationRequest,
        user_id: str = "test-user-001"  # デフォルトユーザーID
    ) -> PointCalculationResponse:
        """
        ポイント計算を実行する
        
        Args:
            request: ポイント計算リクエスト
            user_id: ユーザーID（個人ルール検索用）
            
        Returns:
            ポイント計算結果
        """
        # ルールセットを取得（個人ルール→グローバルルールの順で検索）
        ruleset = await self.get_ruleset(request.rulesetId, user_id)
        
        if not ruleset:
            raise ValueError("指定されたルールセットが見つかりません")
        
        # ポイント計算を実行
        result = self.point_calculator.calculate_final_points(
            ruleset=ruleset,
            rank=request.rank,
            raw_score=request.rawScore
        )
        
        return PointCalculationResponse(
            finalPoints=result["finalPoints"],
            calculation=result["calculation"]
        )
    
    async def get_rule_templates(self) -> RuleTemplateResponse:
        """
        ルールテンプレート一覧を取得する
        
        Returns:
            ルールテンプレート一覧
        """
        templates = self.point_calculator.get_common_rule_templates()
        
        return RuleTemplateResponse(templates=templates)
    
    async def get_rule_options(self) -> RuleOptionsResponse:
        """
        ルール選択肢一覧を取得する
        
        Returns:
            ルール選択肢一覧
        """
        options = self.point_calculator.get_rule_options()
        
        return RuleOptionsResponse(
            basicRuleOptions=options["basicRuleOptions"],
            gameplayRuleOptions=options["gameplayRuleOptions"],
            commonUmaPatterns=options["commonUmaPatterns"]
        )
    
    async def create_default_global_rulesets(self) -> List[Ruleset]:
        """
        デフォルトのグローバルルールセットを作成する
        
        Returns:
            作成されたルールセット一覧
        """
        templates = self.point_calculator.get_common_rule_templates()
        created_rulesets = []
        
        for template in templates:
            # テンプレートからルールセットリクエストを作成
            request = RulesetRequest(
                ruleName=template["name"],
                gameMode=template["gameMode"],
                startingPoints=template["startingPoints"],
                basePoints=template["basePoints"],
                useFloatingUma=False,
                uma=template["uma"],
                oka=template["oka"],
                useChips=template.get("useChips", False),
                memo=template.get("description")
            )
            
            # グローバルルールセットとして作成
            ruleset = await self.create_ruleset(
                request=request,
                created_by="system",
                is_global=True
            )
            
            created_rulesets.append(ruleset)
        
        return created_rulesets


# サービスインスタンスを取得する関数
_ruleset_service_instance = None


def get_ruleset_service() -> RulesetService:
    """ルールセットサービスのシングルトンインスタンスを取得"""
    global _ruleset_service_instance
    if _ruleset_service_instance is None:
        _ruleset_service_instance = RulesetService()
    return _ruleset_service_instance