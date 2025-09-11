import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { JanlogStackProps } from './../common/stack-props';

export class S3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: JanlogStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // 簡易S3バケット（テスト用）
    const testBucket = new s3.Bucket(this, 'JanlogTestBucket', {
      bucketName: `janlog-test-bucket-${environment}-${this.account}`,
      removalPolicy: environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'production',
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 出力
    new cdk.CfnOutput(this, 'TestBucketName', {
      value: testBucket.bucketName,
      description: 'Test S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'TestBucketArn', {
      value: testBucket.bucketArn,
      description: 'Test S3 Bucket ARN',
    });
  }
}