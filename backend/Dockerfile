# AWS Lambda Python ベース
FROM public.ecr.aws/lambda/python:3.12

# LWA を拡張として追加
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# zscaler証明書をコピー（pip install用）
COPY certifications/zscaler.crt /etc/ssl/certs/zscaler.crt

# 依存インストール（証明書設定を使用）
WORKDIR /var/task
COPY requirements.txt .
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/zscaler.crt \
    SSL_CERT_FILE=/etc/ssl/certs/zscaler.crt
RUN pip install --no-cache-dir -r requirements.txt

# pip install完了後、証明書ファイルと環境変数を削除
RUN rm -f /etc/ssl/certs/zscaler.crt
ENV REQUESTS_CA_BUNDLE= \
    SSL_CERT_FILE=

# アプリ本体
COPY app ./app

# LWA用環境変数
ENV PORT=8000 \
    READINESS_CHECK_PATH=/health

# ENTRYPOINT を上書きして Uvicorn を直接起動
ENTRYPOINT ["python","-m","uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]