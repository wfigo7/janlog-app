#!/bin/bash

# Expo Web版のS3デプロイスクリプト

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境変数のチェック
ENVIRONMENT=${1:-development}
BUCKET_NAME="janlog-frontend-${ENVIRONMENT}"
DISTRIBUTION_ID=""
AWS_REGION=${AWS_REGION:-ap-northeast-1}

echo -e "${GREEN}=== Expo Web版デプロイスクリプト ===${NC}"
echo -e "環境: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "バケット: ${YELLOW}${BUCKET_NAME}${NC}"
echo -e "リージョン: ${YELLOW}${AWS_REGION}${NC}"

# CloudFront Distribution IDを取得
echo -e "\n${GREEN}CloudFront Distribution IDを取得中...${NC}"
echo -e "スタック名: ${YELLOW}JanlogCloudFrontStack-${ENVIRONMENT}${NC}"

# Distribution IDを取得（エラーメッセージを表示）
echo -e "${YELLOW}AWS CLIコマンド実行中...${NC}"
STACK_DESCRIBE_OUTPUT=$(aws cloudformation describe-stacks \
  --region "${AWS_REGION}" \
  --stack-name "JanlogCloudFrontStack-${ENVIRONMENT}" 2>&1)
STACK_DESCRIBE_EXIT_CODE=$?

if [ $STACK_DESCRIBE_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}エラー: CloudFormationスタックの取得に失敗しました${NC}"
  echo -e "${RED}エラー詳細:${NC}"
  echo "$STACK_DESCRIBE_OUTPUT"
  DISTRIBUTION_ID=""
else
  DISTRIBUTION_ID=$(echo "$STACK_DESCRIBE_OUTPUT" | \
    jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="DistributionId") | .OutputValue' 2>/dev/null || echo "")
  
  if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "null" ]; then
    echo -e "Distribution ID: ${YELLOW}${DISTRIBUTION_ID}${NC}"
  else
    echo -e "${YELLOW}警告: CloudFront Distribution IDが見つかりませんでした${NC}"
    echo -e "${YELLOW}スタック情報:${NC}"
    echo "$STACK_DESCRIBE_OUTPUT" | jq '.Stacks[0].Outputs' 2>/dev/null || echo "$STACK_DESCRIBE_OUTPUT"
    DISTRIBUTION_ID=""
  fi
fi

if [ -z "$DISTRIBUTION_ID" ]; then
  echo -e "${YELLOW}キャッシュの無効化はスキップされます${NC}"
fi



# ビルドディレクトリの確認
if [ ! -d "dist" ]; then
  echo -e "${RED}エラー: distディレクトリが見つかりません${NC}"
  echo -e "${YELLOW}先に 'npm run web:build:dev' を実行してください${NC}"
  exit 1
fi

# S3にアップロード
echo -e "\n${GREEN}S3にアップロード中...${NC}"
aws s3 sync dist/ "s3://${BUCKET_NAME}/" \
  --region "${AWS_REGION}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json"

# HTMLとJSONファイルは短いキャッシュ時間で
echo -e "${GREEN}HTMLとJSONファイルをアップロード中...${NC}"
aws s3 sync dist/ "s3://${BUCKET_NAME}/" \
  --region "${AWS_REGION}" \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "*.json"

echo -e "${GREEN}✓ S3へのアップロード完了${NC}"

# CloudFrontキャッシュの無効化
if [ -n "$DISTRIBUTION_ID" ]; then
  echo -e "\n${GREEN}CloudFrontキャッシュを無効化中...${NC}"
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)
  
  echo -e "${GREEN}✓ キャッシュ無効化リクエスト送信完了${NC}"
  echo -e "Invalidation ID: ${YELLOW}${INVALIDATION_ID}${NC}"
  echo -e "${YELLOW}キャッシュの無効化には数分かかる場合があります${NC}"
fi

# CloudFront URLを表示
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --region "${AWS_REGION}" \
  --stack-name "JanlogCloudFrontStack-${ENVIRONMENT}" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionUrl'].OutputValue | [0]" \
  --output text 2>/dev/null || echo "")

echo -e "\n${GREEN}=== デプロイ完了 ===${NC}"
if [ -n "$CLOUDFRONT_URL" ]; then
  echo -e "URL: ${YELLOW}${CLOUDFRONT_URL}${NC}"
else
  echo -e "URL: ${YELLOW}https://${BUCKET_NAME}.s3.ap-northeast-1.amazonaws.com/index.html${NC}"
fi
