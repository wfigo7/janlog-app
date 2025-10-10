import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { JanlogStackProps } from './../common/stack-props';

export class S3Stack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: JanlogStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // フロントエンド配信用S3バケット（Web版アプリ用）
    this.frontendBucket = new s3.Bucket(this, 'JanlogFrontendBucket', {
      bucketName: `janlog-frontend-${environment}`,
      // バケットは常に保持（Web版アプリのデプロイ先として使用するため）
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // autoDeleteObjectsはfalseに設定（手動削除が必要）
      autoDeleteObjects: false,
      versioned: false,
      // CloudFront経由のみアクセス可能にするため、パブリックアクセスをブロック
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // CORS設定（API Gateway連携用）
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'], // CloudFrontのドメインに制限することも可能
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // 出力
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'Frontend S3 Bucket Name',
      exportName: `janlog-frontend-bucket-name-${environment}`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketArn', {
      value: this.frontendBucket.bucketArn,
      description: 'Frontend S3 Bucket ARN',
      exportName: `janlog-frontend-bucket-arn-${environment}`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketDomainName', {
      value: this.frontendBucket.bucketRegionalDomainName,
      description: 'Frontend S3 Bucket Regional Domain Name',
      exportName: `janlog-frontend-bucket-domain-${environment}`,
    });
  }
}