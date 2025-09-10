"""
ローカル開発用のuvicornサーバー起動スクリプト
"""
import uvicorn
import os

if __name__ == "__main__":
    # 環境変数を設定
    os.environ.setdefault("ENVIRONMENT", "development")
    
    # uvicornサーバーを起動
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )