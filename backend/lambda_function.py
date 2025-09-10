"""
Lambda Web Adapter エントリーポイント
FastAPIアプリケーションをLambdaで実行するためのハンドラー
"""
from mangum import Mangum
from app.main import app

# Lambda Web Adapter用のハンドラー
handler = Mangum(app, lifespan="off")

# Lambda関数のエントリーポイント
def lambda_handler(event, context):
    """
    AWS Lambda関数のメインハンドラー
    """
    return handler(event, context)