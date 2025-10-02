"""
Janlog Backend - FastAPI Application with Lambda Web Adapter
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# 環境変数の読み込み（開発環境用）
if os.path.exists(".env.local"):
    load_dotenv(".env.local")

from app.config.settings import settings
from app.utils.dynamodb_utils import get_dynamodb_client
from app.utils.auth_utils import get_current_user, get_current_user_id
from app.models.match import MatchRequest, MatchListResponse
from app.models.stats import StatsSummary
from app.models.user import UserResponse
from app.models.venue import VenueResponse
from app.services.match_service import get_match_service
from app.services.stats_service import get_stats_service
from app.services.cognito_service import get_cognito_service
from app.services.venue_service import venue_service

# FastAPIアプリケーションの初期化
app = FastAPI(
    title="Janlog API",
    description="麻雀成績記録アプリのバックエンドAPI",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンに制限
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# レスポンスモデル
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str
    services: Dict[str, str]


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    ヘルスチェックエンドポイント
    アプリケーションとDynamoDBの稼働状況を確認する
    """
    # DynamoDBの接続確認
    dynamodb_client = get_dynamodb_client()
    dynamodb_status = "healthy" if await dynamodb_client.health_check() else "unhealthy"

    # 開発環境では DynamoDB の状態に関係なく API は healthy とする
    if settings.is_development:
        overall_status = "healthy"
    else:
        overall_status = "healthy" if dynamodb_status == "healthy" else "unhealthy"

    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        services={"dynamodb": dynamodb_status, "api": "healthy"},
    )


@app.get("/")
async def root() -> Dict[str, Any]:
    """
    ルートエンドポイント
    API情報を返す
    """
    return {
        "message": "Janlog API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health",
    }


# エラーハンドラー
from fastapi.responses import JSONResponse


@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404, content={"detail": "エンドポイントが見つかりません"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500, content={"detail": "内部サーバーエラーが発生しました"}
    )


# 対局記録API（認証なし、固定ユーザーID使用）
FIXED_USER_ID = "test-user-001"  # 開発用固定ユーザーID


# 対局関連エンドポイント
# 認証なし版（固定ユーザーID使用）
FIXED_USER_ID = "test-user-001"  # 開発用固定ユーザーID


@app.post("/matches", status_code=201)
async def create_match(request: MatchRequest) -> Dict[str, Any]:
    """
    対局を登録（認証なし、固定ユーザーID使用）
    """
    try:
        match_service = get_match_service()
        match = await match_service.create_match(request, FIXED_USER_ID)

        return {
            "success": True,
            "message": "対局を登録しました",
            "data": match.to_api_response(),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="対局登録に失敗しました")


@app.get("/matches")
async def get_matches(
    from_date: Optional[str] = Query(
        None, alias="from", description="開始日（YYYY-MM-DD形式）"
    ),
    to_date: Optional[str] = Query(
        None, alias="to", description="終了日（YYYY-MM-DD形式）"
    ),
    mode: Optional[str] = Query("all", description="ゲームモード（three/four/all）"),
    limit: Optional[int] = Query(20, description="取得件数上限"),
    next_key: Optional[str] = Query(None, description="次のページのキー（Base64エンコード）"),
) -> Dict[str, Any]:
    """
    対局一覧を取得（認証なし、固定ユーザーID使用）
    """
    try:
        import json
        import base64
        
        # next_keyをデコード
        last_evaluated_key = None
        if next_key:
            try:
                decoded_key = base64.b64decode(next_key).decode('utf-8')
                last_evaluated_key = json.loads(decoded_key)
            except Exception as e:
                logger.warning(f"Invalid next_key format: {e}")
        
        match_service = get_match_service()
        result = await match_service.get_matches(
            user_id=FIXED_USER_ID,
            from_date=from_date,
            to_date=to_date,
            game_mode=mode,
            limit=limit,
            last_evaluated_key=last_evaluated_key,
        )

        # next_keyをエンコード
        encoded_next_key = None
        if result.get("nextKey"):
            try:
                key_json = json.dumps(result["nextKey"])
                encoded_next_key = base64.b64encode(key_json.encode('utf-8')).decode('utf-8')
            except Exception as e:
                logger.warning(f"Failed to encode next_key: {e}")

        return {
            "success": True,
            "data": result["matches"],
            "pagination": {
                "total": result["total"],
                "hasMore": result["hasMore"],
                "nextKey": encoded_next_key,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="対局一覧取得に失敗しました")


@app.get("/matches/{match_id}")
async def get_match(match_id: str) -> Dict[str, Any]:
    """
    対局詳細を取得（認証なし、固定ユーザーID使用）
    """
    try:
        match_service = get_match_service()
        match = await match_service.get_match_by_id(FIXED_USER_ID, match_id)

        if not match:
            raise HTTPException(status_code=404, detail="対局が見つかりません")

        return {"success": True, "data": match.to_api_response()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="対局取得に失敗しました")


@app.put("/matches/{match_id}")
async def update_match(match_id: str, request: MatchRequest) -> Dict[str, Any]:
    """
    対局を更新（認証なし、固定ユーザーID使用）
    """
    try:
        match_service = get_match_service()
        match = await match_service.update_match(FIXED_USER_ID, match_id, request)

        if not match:
            raise HTTPException(status_code=404, detail="対局が見つかりません")

        return {
            "success": True,
            "message": "対局を更新しました",
            "data": match.to_api_response(),
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="対局更新に失敗しました")


@app.delete("/matches/{match_id}")
async def delete_match(match_id: str) -> Dict[str, Any]:
    """
    対局を削除（認証なし、固定ユーザーID使用）
    """
    try:
        match_service = get_match_service()
        success = await match_service.delete_match(FIXED_USER_ID, match_id)

        if not success:
            raise HTTPException(status_code=404, detail="対局が見つかりません")

        return {"success": True, "message": "対局を削除しました"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="対局削除に失敗しました")


# 統計API
@app.get("/stats/summary")
async def get_stats_summary(
    from_date: Optional[str] = Query(
        None, alias="from", description="開始日（YYYY-MM-DD形式）"
    ),
    to_date: Optional[str] = Query(
        None, alias="to", description="終了日（YYYY-MM-DD形式）"
    ),
    mode: Optional[str] = Query("four", description="ゲームモード（three/four）"),
) -> Dict[str, Any]:
    """
    成績サマリを取得（認証なし、固定ユーザーID使用）
    """
    try:
        stats_service = get_stats_service()
        stats = await stats_service.calculate_stats_summary(
            user_id=FIXED_USER_ID,
            from_date=from_date,
            to_date=to_date,
            game_mode=mode,
        )

        return {"success": True, "data": stats.to_api_response()}

    except Exception as e:
        raise HTTPException(status_code=500, detail="統計取得に失敗しました")


# 会場関連エンドポイント
@app.get("/venues")
async def get_venues() -> Dict[str, Any]:
    """
    ユーザーの会場一覧を取得（認証なし、固定ユーザーID使用）
    """
    try:
        venues = await venue_service.get_user_venues(FIXED_USER_ID)
        return {
            "success": True,
            "data": [venue.dict(by_alias=True) for venue in venues]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="会場一覧取得に失敗しました")


# 認証関連エンドポイント
@app.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> UserResponse:
    """
    現在のユーザー情報を取得する
    """
    try:
        cognito_service = get_cognito_service()
        user_info = await cognito_service.get_user_info(current_user["user_id"])

        if not user_info:
            raise HTTPException(status_code=404, detail="ユーザー情報が見つかりません")

        return UserResponse(
            user_id=user_info["user_id"],
            email=user_info["email"],
            display_name=user_info.get("display_name"),
            role=user_info.get("role", "user"),
            last_login_at=user_info.get("last_modified_date"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="ユーザー情報の取得に失敗しました")


# ルールセット関連API（認証なし、固定ユーザーID使用）
from app.models.ruleset import (
    RulesetRequest,
    RulesetListResponse,
    PointCalculationRequest,
    PointCalculationResponse,
    RuleTemplateResponse,
    RuleOptionsResponse,
)
from app.services.ruleset_service import get_ruleset_service


@app.get("/rulesets", response_model=RulesetListResponse)
async def get_rulesets() -> RulesetListResponse:
    """
    ルールセット一覧を取得する（認証なし、固定ユーザーID使用）
    """
    try:
        ruleset_service = get_ruleset_service()
        return await ruleset_service.get_rulesets(
            user_id=FIXED_USER_ID, include_global=True
        )
    except Exception as e:
        print(f"ルールセット一覧取得エラー: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"ルールセット一覧取得に失敗しました: {str(e)}"
        )


@app.post("/rulesets", response_model=dict, status_code=201)
async def create_ruleset(request: RulesetRequest) -> dict:
    """
    ルールセットを作成する（認証なし、固定ユーザーID使用）
    """
    try:
        ruleset_service = get_ruleset_service()
        ruleset = await ruleset_service.create_ruleset(
            request=request,
            created_by=FIXED_USER_ID,
            is_global=False,  # 個人ルールとして作成
        )

        return {
            "success": True,
            "message": "ルールセットを作成しました",
            "data": ruleset.to_api_response(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="ルールセット作成に失敗しました")


@app.get("/rulesets/{ruleset_id}", response_model=dict)
async def get_ruleset(ruleset_id: str) -> dict:
    """
    特定のルールセットを取得する（認証なし、固定ユーザーID使用）
    """
    try:
        ruleset_service = get_ruleset_service()
        ruleset = await ruleset_service.get_ruleset(
            ruleset_id=ruleset_id, user_id=FIXED_USER_ID
        )

        if not ruleset:
            raise HTTPException(status_code=404, detail="ルールセットが見つかりません")

        return {"success": True, "data": ruleset.to_api_response()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="ルールセット取得に失敗しました")


@app.put("/rulesets/{ruleset_id}", response_model=dict)
async def update_ruleset(ruleset_id: str, request: RulesetRequest) -> dict:
    """
    ルールセットを更新する（認証なし、固定ユーザーID使用）
    """
    try:
        ruleset_service = get_ruleset_service()
        ruleset = await ruleset_service.update_ruleset(
            ruleset_id=ruleset_id, request=request, user_id=FIXED_USER_ID
        )

        if not ruleset:
            raise HTTPException(status_code=404, detail="ルールセットが見つかりません")

        return {
            "success": True,
            "message": "ルールセットを更新しました",
            "data": ruleset.to_api_response(),
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="ルールセット更新に失敗しました")


@app.delete("/rulesets/{ruleset_id}")
async def delete_ruleset(ruleset_id: str) -> dict:
    """
    ルールセットを削除する（認証なし、固定ユーザーID使用）
    """
    try:
        ruleset_service = get_ruleset_service()
        success = await ruleset_service.delete_ruleset(
            ruleset_id=ruleset_id, user_id=FIXED_USER_ID
        )

        if not success:
            raise HTTPException(status_code=404, detail="ルールセットが見つかりません")

        return {"success": True, "message": "ルールセットを削除しました"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="ルールセット削除に失敗しました")


@app.post("/rulesets/calculate", response_model=PointCalculationResponse)
async def calculate_points(
    request: PointCalculationRequest,
) -> PointCalculationResponse:
    """
    ポイント計算を実行する（プレビュー用）
    """
    try:
        ruleset_service = get_ruleset_service()
        return await ruleset_service.calculate_points(request, FIXED_USER_ID)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="ポイント計算に失敗しました")


@app.get("/rulesets-templates", response_model=RuleTemplateResponse)
async def get_rule_templates() -> RuleTemplateResponse:
    """
    ルールテンプレート一覧を取得する
    """
    try:
        ruleset_service = get_ruleset_service()
        return await ruleset_service.get_rule_templates()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="ルールテンプレート取得に失敗しました"
        )


@app.get("/rulesets-rule-options", response_model=RuleOptionsResponse)
async def get_rule_options() -> RuleOptionsResponse:
    """
    ルール選択肢一覧を取得する（UI用）
    """
    try:
        ruleset_service = get_ruleset_service()
        return await ruleset_service.get_rule_options()
    except Exception as e:
        raise HTTPException(status_code=500, detail="ルール選択肢取得に失敗しました")


# 招待機能はCognitoコンソールから直接実行するため、APIエンドポイントは不要


# 認証付きエンドポイント（将来フェーズ2で使用）
@app.post("/api/v1/matches", status_code=201)
async def create_match_authenticated(
    request: MatchRequest, user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    対局を登録（認証付き）
    """
    try:
        match_service = get_match_service()
        match = await match_service.create_match(request, user_id)

        return {
            "success": True,
            "message": "対局を登録しました",
            "data": match.to_api_response(),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="対局登録に失敗しました")


@app.get("/api/v1/matches")
async def get_matches_authenticated(
    user_id: str = Depends(get_current_user_id),
    from_date: Optional[str] = Query(
        None, alias="from", description="開始日（YYYY-MM-DD形式）"
    ),
    to_date: Optional[str] = Query(
        None, alias="to", description="終了日（YYYY-MM-DD形式）"
    ),
    mode: Optional[str] = Query("all", description="ゲームモード（three/four/all）"),
    limit: Optional[int] = Query(100, description="取得件数上限"),
) -> MatchListResponse:
    """
    対局一覧を取得（認証付き）
    """
    try:
        match_service = get_match_service()
        result = await match_service.get_matches(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            game_mode=mode,
            limit=limit,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail="対局一覧取得に失敗しました")


@app.get("/api/v1/stats/summary")
async def get_stats_summary_authenticated(
    user_id: str = Depends(get_current_user_id),
    from_date: Optional[str] = Query(
        None, alias="from", description="開始日（YYYY-MM-DD形式）"
    ),
    to_date: Optional[str] = Query(
        None, alias="to", description="終了日（YYYY-MM-DD形式）"
    ),
    mode: Optional[str] = Query("four", description="ゲームモード（three/four）"),
) -> Dict[str, Any]:
    """
    成績サマリを取得（認証付き）
    """
    try:
        stats_service = get_stats_service()
        stats = await stats_service.calculate_stats_summary(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            game_mode=mode,
        )

        return {"success": True, "data": stats.to_api_response()}

    except Exception as e:
        raise HTTPException(status_code=500, detail="統計取得に失敗しました")
