"""
Janlog Backend - FastAPI Application with Lambda Web Adapter
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from datetime import datetime
from typing import Dict, Any
from app.config.settings import settings
from app.utils.dynamodb_utils import get_dynamodb_client

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
        timestamp=datetime.utcnow().isoformat(),
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
    return JSONResponse(status_code=404, content={"detail": "エンドポイントが見つかりません"})


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": "内部サーバーエラーが発生しました"})
