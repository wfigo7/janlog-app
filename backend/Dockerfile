# AWS Lambda Python ベース
FROM public.ecr.aws/lambda/python:3.12

# LWA を拡張として追加
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# 依存インストール
WORKDIR /var/task
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリ本体
COPY app ./app

# LWA用環境変数
ENV PORT=8000 \
    READINESS_CHECK_PATH=/health

# ENTRYPOINT を上書きして Uvicorn を直接起動
ENTRYPOINT ["python","-m","uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]