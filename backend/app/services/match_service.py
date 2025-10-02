"""
対局管理サービス
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from app.config.settings import settings
from app.models.match import Match, MatchRequest
from app.utils.dynamodb_utils import get_dynamodb_client


class MatchService:
    """対局管理サービス"""

    def __init__(self):
        self.dynamodb_client = get_dynamodb_client()
        self.table_name = settings.DYNAMODB_TABLE_NAME

    async def create_match(self, match_request: MatchRequest, user_id: str) -> Match:
        """対局を作成"""
        # 日付の自動補完（要件10.7対応）
        match_request = self._normalize_match_date(match_request)
        
        # 会場の自動マスタ化処理
        match_request = await self._process_venue(match_request, user_id)
        
        # 仮スコア方式の場合は自動計算
        if match_request.entryMethod == "provisional_rank_only":
            match_request = await self._calculate_provisional_score(match_request, user_id)
        
        # チップなしルールの場合はchipCountをnullに設定
        match_request = await self._adjust_chip_count_by_ruleset(match_request, user_id)
        
        # リクエストから対局データを作成
        match = Match.from_request(match_request, user_id)
        
        try:
            # DynamoDBに保存
            item = match.to_dynamodb_item()
            await self.dynamodb_client.put_item(self.table_name, item)
            return match
        except Exception as e:
            raise Exception(f"対局の作成に失敗しました: {str(e)}")

    def _normalize_match_date(self, match_request: MatchRequest) -> MatchRequest:
        """対局日の正規化（要件10.7: ISO 8601形式、時刻00:00:00自動補完）"""
        if match_request.date:
            try:
                # 日付文字列をパース
                date_obj = datetime.fromisoformat(match_request.date.replace("Z", "+00:00"))
                
                # 時刻を00:00:00に設定してISO 8601形式で再フォーマット
                normalized_date = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
                match_request.date = normalized_date.isoformat()
                
            except ValueError:
                # パースに失敗した場合はそのまま（バリデーションでエラーになる）
                pass
        
        return match_request

    async def _process_venue(self, match_request: MatchRequest, user_id: str) -> MatchRequest:
        """会場の自動マスタ化処理"""
        if match_request.venueName:
            try:
                from app.services.venue_service import venue_service
                
                # 会場を検索または作成
                venue = await venue_service.find_or_create_venue(user_id, match_request.venueName)
                
                # リクエストに会場IDと正規化された会場名を設定
                match_request.venueId = venue.venue_id
                match_request.venueName = venue.venue_name
                
            except Exception as e:
                # 会場処理に失敗した場合はログに記録して続行
                print(f"会場処理エラー: {e}")
        
        return match_request

    async def _calculate_provisional_score(self, match_request: MatchRequest, user_id: str) -> MatchRequest:
        """仮スコア方式の場合の自動計算"""
        from app.services.ruleset_service import get_ruleset_service
        from app.utils.point_calculator import PointCalculator
        
        # ルールセットを取得
        if not match_request.rulesetId:
            raise ValueError("仮スコア方式ではルールセットの選択が必要です")
        
        ruleset_service = get_ruleset_service()
        ruleset = await ruleset_service.get_ruleset(match_request.rulesetId, user_id)
        
        if not ruleset:
            raise ValueError("指定されたルールセットが見つかりません")
        
        # 仮スコア計算
        result = PointCalculator.calculate_provisional_points(ruleset, match_request.rank)
        
        # リクエストを更新
        match_request.finalPoints = result["finalPoints"]
        match_request.rawScore = result["calculation"]["provisionalRawScore"]
        
        return match_request

    async def _adjust_chip_count_by_ruleset(self, match_request: MatchRequest, user_id: str) -> MatchRequest:
        """ルールセットの設定に基づいてchipCountを調整"""
        if match_request.rulesetId:
            try:
                from app.services.ruleset_service import get_ruleset_service
                
                ruleset_service = get_ruleset_service()
                ruleset = await ruleset_service.get_ruleset(match_request.rulesetId, user_id)
                
                # チップなしルールの場合はchipCountをnullに設定
                if ruleset and not getattr(ruleset, 'useChips', False):
                    match_request.chipCount = None
                    
            except Exception:
                # ルールセット取得に失敗した場合は元のリクエストをそのまま返す
                pass
        
        return match_request

    async def get_matches(
        self,
        user_id: str,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        game_mode: Optional[str] = None,
        limit: Optional[int] = 100,
        last_evaluated_key: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """対局一覧を取得"""
        try:
            # パーティションキーでクエリ
            pk = f"USER#{user_id}"
            
            # キー条件式
            key_condition_expression = "PK = :pk AND begins_with(SK, :sk_prefix)"
            expression_attribute_values = {
                ":pk": pk,
                ":sk_prefix": "MATCH#"
            }
            
            # 日付フィルター条件を追加
            filter_expressions = []
            
            if from_date:
                filter_expressions.append("#date >= :from_date")
                expression_attribute_values[":from_date"] = from_date
            
            if to_date:
                filter_expressions.append("#date <= :to_date")
                expression_attribute_values[":to_date"] = to_date
            
            if game_mode and game_mode != "all":
                filter_expressions.append("gameMode = :mode")
                expression_attribute_values[":mode"] = game_mode
            
            # フィルター式を結合
            filter_expression = " AND ".join(filter_expressions) if filter_expressions else None
            
            # 属性名のマッピング（予約語対策）
            expression_attribute_names = {"#date": "date"} if from_date or to_date else None
            
            # DynamoDBからデータを取得（ページネーション対応）
            query_params = {
                "table_name": self.table_name,
                "key_condition_expression": key_condition_expression,
                "expression_attribute_values": expression_attribute_values,
                "limit": limit,
            }
            
            if filter_expression:
                query_params["filter_expression"] = filter_expression
            
            if expression_attribute_names:
                query_params["expression_attribute_names"] = expression_attribute_names
            
            if last_evaluated_key:
                query_params["exclusive_start_key"] = last_evaluated_key
            
            result = await self.dynamodb_client.query_items_with_pagination(**query_params)
            items = result.get("items", [])
            next_key = result.get("last_evaluated_key")
            
            # Matchオブジェクトに変換してAPIレスポンス形式に変換
            matches = []
            for item in items:
                try:
                    match = Match(**item)
                    matches.append(match.to_api_response())
                except Exception as e:
                    # 個別のアイテム変換エラーはログに記録して続行
                    print(f"対局データの変換エラー: {e}, item: {item}")
                    continue
            
            # 日付順でソート（新しい順）
            matches.sort(key=lambda x: x["date"], reverse=True)
            
            return {
                "matches": matches,
                "total": len(matches),
                "hasMore": next_key is not None,
                "nextKey": next_key,
            }
            
        except Exception as e:
            raise Exception(f"対局一覧の取得に失敗しました: {str(e)}")

    async def get_match_by_id(self, user_id: str, match_id: str) -> Optional[Match]:
        """IDで対局を取得"""
        try:
            pk = f"USER#{user_id}"
            sk = f"MATCH#{match_id}"
            
            item = await self.dynamodb_client.get_item(self.table_name, pk, sk)
            if item:
                return Match(**item)
            return None
            
        except Exception as e:
            raise Exception(f"対局の取得に失敗しました: {str(e)}")

    async def update_match(self, user_id: str, match_id: str, match_request: MatchRequest) -> Optional[Match]:
        """対局を更新"""
        try:
            # 既存の対局を取得
            existing_match = await self.get_match_by_id(user_id, match_id)
            if not existing_match:
                return None
            
            # 日付の自動補完（要件10.7対応）
            match_request = self._normalize_match_date(match_request)
            
            # 会場の自動マスタ化処理
            match_request = await self._process_venue(match_request, user_id)
            
            # チップなしルールの場合はchipCountをnullに設定
            match_request = await self._adjust_chip_count_by_ruleset(match_request, user_id)
            
            # 新しいデータで更新
            updated_match = Match.from_request(match_request, user_id)
            updated_match.matchId = match_id  # IDは保持
            updated_match.createdAt = existing_match.createdAt  # 作成日時は保持
            
            # DynamoDBに保存
            item = updated_match.to_dynamodb_item()
            await self.dynamodb_client.put_item(self.table_name, item)
            
            return updated_match
            
        except Exception as e:
            raise Exception(f"対局の更新に失敗しました: {str(e)}")

    async def delete_match(self, user_id: str, match_id: str) -> bool:
        """対局を削除"""
        try:
            pk = f"USER#{user_id}"
            sk = f"MATCH#{match_id}"
            
            # 存在確認
            existing_match = await self.get_match_by_id(user_id, match_id)
            if not existing_match:
                return False
            
            # 削除実行
            await self.dynamodb_client.delete_item(self.table_name, pk, sk)
            return True
            
        except Exception as e:
            raise Exception(f"対局の削除に失敗しました: {str(e)}")


# サービスインスタンスを取得する関数
_match_service_instance = None


def get_match_service() -> MatchService:
    """MatchServiceのシングルトンインスタンスを取得"""
    global _match_service_instance
    if _match_service_instance is None:
        _match_service_instance = MatchService()
    return _match_service_instance