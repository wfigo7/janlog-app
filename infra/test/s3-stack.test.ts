import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { S3Stack } from '../lib/stacks/s3-stack';
import { defaultStackProps } from '../lib/common/stack-props';

describe('S3Stack', () => {
    let app: cdk.App;
    let stack: S3Stack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
        stack = new S3Stack(app, 'TestS3Stack', {
            ...defaultStackProps,
            environment: 'test',
        });
        template = Template.fromStack(stack);
    });

    test('S3バケットが作成される', () => {
        // S3バケットが1つ作成されることを確認
        template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('S3バケットに正しい設定が適用される', () => {
        // S3バケットの設定を確認
        template.hasResourceProperties('AWS::S3::Bucket', {
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        });
    });

    test('開発環境では自動削除が有効になる', () => {
        // 自動削除用のタグが設定されることを確認
        template.hasResourceProperties('AWS::S3::Bucket', {
            Tags: [
                {
                    Key: 'aws-cdk:auto-delete-objects',
                    Value: 'true',
                },
            ],
        });

        // 削除ポリシーが Delete に設定されることを確認
        template.hasResource('AWS::S3::Bucket', {
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
        });
    });

    test('自動削除用のLambda関数が作成される', () => {
        // 自動削除用のLambda関数が作成されることを確認
        template.resourceCountIs('AWS::Lambda::Function', 1);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'nodejs18.x',
            Handler: 'index.handler',
            Timeout: 900,
            MemorySize: 128,
        });
    });

    test('バケットポリシーが作成される', () => {
        // S3バケットポリシーが作成されることを確認
        template.resourceCountIs('AWS::S3::BucketPolicy', 1);
    });

    test('IAMロールが作成される', () => {
        // 自動削除用のIAMロールが作成されることを確認
        template.resourceCountIs('AWS::IAM::Role', 1);

        template.hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                    },
                ],
            },
        });
    });

    test('CloudFormation出力が設定される', () => {
        // CloudFormation出力が設定されることを確認
        template.hasOutput('TestBucketName', {
            Description: 'Test S3 Bucket Name',
        });

        template.hasOutput('TestBucketArn', {
            Description: 'Test S3 Bucket ARN',
        });
    });

    test('本番環境では自動削除が無効になる', () => {
        // 本番環境用のスタックを作成
        const prodApp = new cdk.App();
        const prodStack = new S3Stack(prodApp, 'ProdS3Stack', {
            ...defaultStackProps,
            environment: 'production',
        });
        const prodTemplate = Template.fromStack(prodStack);

        // 本番環境では RETAIN ポリシーが設定される
        prodTemplate.hasResource('AWS::S3::Bucket', {
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
        });
    });

    test('カスタムリソースが正しく設定される', () => {
        // 自動削除用のカスタムリソースが作成されることを確認
        template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);

        // カスタムリソースがS3バケットを参照していることを確認
        const bucketResources = template.findResources('AWS::S3::Bucket');
        const bucketLogicalId = Object.keys(bucketResources)[0];

        template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
            BucketName: {
                Ref: bucketLogicalId,
            },
        });
    });

    test('適切なタグが設定される', () => {
        // 自動削除タグが設定されることを確認
        template.hasResourceProperties('AWS::S3::Bucket', {
            Tags: [
                {
                    Key: 'aws-cdk:auto-delete-objects',
                    Value: 'true',
                },
            ],
        });
    });

    test('スタックが正しいプロパティで作成される', () => {
        // スタックが正しい環境設定で作成されることを確認
        expect(stack.stackName).toBe('TestS3Stack');
        expect(stack.region).toBe('ap-northeast-1');
    });
});