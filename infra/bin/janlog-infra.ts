#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/stacks/s3-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
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

// Cognito・API Gatewayスタックはlocal環境では作成しない
if (environment !== 'local') {
  // Cognitoスタック
  const cognitoStack = new CognitoStack(app, `JanlogCognitoStack-${environment}`, {
    ...defaultStackProps,
    environment,
  });

  // API Gatewayスタック（Cognitoに依存）
  new ApiGatewayStack(app, `JanlogApiGatewayStack-${environment}`, {
    ...defaultStackProps,
    environment,
    userPool: cognitoStack.userPool,
    userPoolClient: cognitoStack.userPoolClient,
  });
}