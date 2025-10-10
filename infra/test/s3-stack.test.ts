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

    test('フロントエンド配信用S3バケットが作成される', () => {
        // S3バケットが1つ作成されることを確認
        template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('S3バケットに正しい設定が適用される', () => {
        // S3バケットの設定を確認（CloudFront経由のみアクセス可能）
        template.hasResourceProperties('AWS::S3::Bucket', {
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        });
    });

    test('CORS設定が適用される', () => {
        // CORS設定が適用されることを確認
        template.hasResourceProperties('AWS::S3::Bucket', {
            CorsConfiguration: {
                CorsRules: [
                    {
                        AllowedMethods: ['GET', 'HEAD'],
                        AllowedOrigins: ['*'],
                        AllowedHeaders: ['*'],
                        MaxAge: 3000,
                    },
                ],
            },
        });
    });

    test('バケットは常にRETAINポリシーが設定される', () => {
        // 全環境でRETAINポリシーが設定されることを確認
        template.hasResource('AWS::S3::Bucket', {
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
        });
    });

    test('CloudFormation出力が設定される', () => {
        // CloudFormation出力が設定されることを確認
        template.hasOutput('FrontendBucketName', {
            Description: 'Frontend S3 Bucket Name',
            Export: {
                Name: 'janlog-frontend-bucket-name-test',
            },
        });

        template.hasOutput('FrontendBucketArn', {
            Description: 'Frontend S3 Bucket ARN',
            Export: {
                Name: 'janlog-frontend-bucket-arn-test',
            },
        });

        template.hasOutput('FrontendBucketDomainName', {
            Description: 'Frontend S3 Bucket Regional Domain Name',
            Export: {
                Name: 'janlog-frontend-bucket-domain-test',
            },
        });
    });

    test('本番環境でもRETAINポリシーが設定される', () => {
        // 本番環境用のスタックを作成
        const prodApp = new cdk.App();
        const prodStack = new S3Stack(prodApp, 'ProdS3Stack', {
            ...defaultStackProps,
            environment: 'production',
        });
        const prodTemplate = Template.fromStack(prodStack);

        // 本番環境でもRETAINポリシーが設定される
        prodTemplate.hasResource('AWS::S3::Bucket', {
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
        });
    });

    test('バケット名が環境に応じて設定される', () => {
        // バケット名が環境に応じて設定されることを確認
        template.hasResourceProperties('AWS::S3::Bucket', {
            BucketName: 'janlog-frontend-test',
        });
    });

    test('スタックが正しいプロパティで作成される', () => {
        // スタックが正しい環境設定で作成されることを確認
        expect(stack.stackName).toBe('TestS3Stack');
        expect(stack.region).toBe('ap-northeast-1');
    });

    test('frontendBucketプロパティが公開される', () => {
        // frontendBucketプロパティが公開されることを確認
        expect(stack.frontendBucket).toBeDefined();
        // バケット名はCDKトークンとして扱われるため、存在確認のみ
        expect(stack.frontendBucket.bucketName).toBeDefined();
    });
});