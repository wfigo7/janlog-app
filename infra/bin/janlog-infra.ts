#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/stacks/s3-stack';
import { CloudFrontStack } from '../lib/stacks/cloudfront-stack';
import { DynamoDBStack } from '../lib/stacks/dynamodb-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { ECRStack } from '../lib/stacks/ecr-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
import { GitHubOidcStack } from '../lib/stacks/github-oidc-stack';
import { defaultStackProps } from '../lib/common/stack-props';

// CDKアプリケーションの作成
const app = new cdk.App();

// 環境設定
const environment = app.node.tryGetContext('environment') || 'development';

// 環境の検証
const validEnvironments = ['local', 'development', 'production'];
if (!validEnvironments.includes(environment)) {
  throw new Error(`Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(', ')}`);
}

// タグの設定
cdk.Tags.of(app).add('Project', defaultStackProps.project!);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Developer', defaultStackProps.developer!);
cdk.Tags.of(app).add('ManagedBy', defaultStackProps.ManagedBy!);

// S3スタック
new S3Stack(app, `JanlogS3Stack-${environment}`, {
  ...defaultStackProps,
  environment,
});

// CloudFrontスタック（バケット名を文字列として渡して循環参照を回避）
new CloudFrontStack(app, `JanlogCloudFrontStack-${environment}`, {
  ...defaultStackProps,
  environment,
  frontendBucketName: `janlog-frontend-${environment}`,
});

// DynamoDBスタック（全環境で作成）
const dynamodbStack = new DynamoDBStack(app, `JanlogDynamoDBStack-${environment}`, {
  ...defaultStackProps,
  environment,
});

// ECR・Cognito・Lambda・API Gatewayスタックはlocal環境では作成しない
if (environment !== 'local') {
  // ECRスタック（独立して最初に作成）
  const ecrStack = new ECRStack(app, `JanlogECRStack-${environment}`, {
    ...defaultStackProps,
    environment,
  });

  // Cognitoスタック
  const cognitoStack = new CognitoStack(app, `JanlogCognitoStack-${environment}`, {
    ...defaultStackProps,
    environment,
  });

  // Lambdaスタック（DynamoDB + Cognito + ECRに依存）
  const lambdaStack = new LambdaStack(app, `JanlogLambdaStack-${environment}`, {
    ...defaultStackProps,
    environment,
    dynamodbTable: dynamodbStack.mainTable,
    userPool: cognitoStack.userPool,
    userPoolClient: cognitoStack.userPoolClient,
    ecrRepository: ecrStack.ecrRepository,
  });

  // API Gatewayスタック（Lambda + Cognitoに依存）
  new ApiGatewayStack(app, `JanlogApiGatewayStack-${environment}`, {
    ...defaultStackProps,
    environment,
    userPool: cognitoStack.userPool,
    userPoolClient: cognitoStack.userPoolClient,
    lambdaFunction: lambdaStack.lambdaFunction,
  });

  // GitHub OIDC スタック（CI/CD用）
  new GitHubOidcStack(app, `JanlogGitHubOidcStack-${environment}`, {
    ...defaultStackProps,
    environment,
    githubOrg: 'wfigo7',  // GitHub organizationまたはユーザー名
    githubRepo: 'janlog-app',  // リポジトリ名
  });
}