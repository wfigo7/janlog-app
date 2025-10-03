"""
Lambda Web Adapter エントリーポイント
FastAPIアプリケーションをLambdaで実行するためのハンドラー
LWAを使用する場合、FastAPIアプリを直接起動します
"""

def lambda_handler(event, context):
    """
    AWS Lambda関数のメインハンドラー
    LWAを使用する場合、この関数は実際には呼ばれません
    """
    # LWAを使用する場合、この関数は実際には呼ばれません
    # LWAがHTTPサーバーとして動作し、FastAPIアプリを直接実行します
    return {"statusCode": 200, "body": "LWA is handling requests"}

# LWA用のエントリーポイント
if __name__ == "__main__":
    # LWAがこのスクリプトを実行してFastAPIアプリを起動
    import uvicorn
    from app.main import app
    uvicorn.run(app, host="0.0.0.0", port=8000)