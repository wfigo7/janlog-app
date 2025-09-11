#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/stacks/s3-stack';
import { defaultStackProps } from '../lib/common/stack-props';

// CDKアプリケーションの作成
const app = new cdk.App();

// 環境設定
const environment = app.node.tryGetContext('environment') || 'development';

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