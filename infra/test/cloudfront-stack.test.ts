import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CloudFrontStack } from '../lib/stacks/cloudfront-stack';
import { defaultStackProps } from '../lib/common/stack-props';

describe('CloudFrontStack', () => {
    let app: cdk.App;
    let stack: CloudFrontStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
        
        stack = new CloudFrontStack(app, 'TestCloudFrontStack', {
            ...defaultStackProps,
            environment: 'test',
            frontendBucketName: 'test-bucket',
        });
        template = Template.fromStack(stack);
    });

    test('CloudFront Distributionが作成される', () => {
        // CloudFront Distributionが1つ作成されることを確認
        template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('Origin Access Control (OAC)が作成される', () => {
        // S3BucketOrigin.withOriginAccessControlを使用すると、OACが自動的に作成される
        template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);

        template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
            OriginAccessControlConfig: {
                OriginAccessControlOriginType: 's3',
                SigningBehavior: 'always',
                SigningProtocol: 'sigv4',
            },
        });
    });

    test('HTTPS強制が設定される', () => {
        // HTTPS強制が設定されることを確認
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                DefaultCacheBehavior: {
                    ViewerProtocolPolicy: 'redirect-to-https',
                },
            },
        });
    });

    test('デフォルトルートオブジェクトが設定される', () => {
        // デフォルトルートオブジェクトがindex.htmlに設定されることを確認
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                DefaultRootObject: 'index.html',
            },
        });
    });

    test('SPA対応のエラーページ設定がされる', () => {
        // 404と403エラーをindex.htmlにリダイレクトする設定を確認
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                CustomErrorResponses: [
                    {
                        ErrorCode: 404,
                        ResponseCode: 200,
                        ResponsePagePath: '/index.html',
                    },
                    {
                        ErrorCode: 403,
                        ResponseCode: 200,
                        ResponsePagePath: '/index.html',
                    },
                ],
            },
        });
    });

    test('圧縮が有効になる', () => {
        // 圧縮が有効になることを確認
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                DefaultCacheBehavior: {
                    Compress: true,
                },
            },
        });
    });

    test('HTTP/2とHTTP/3が有効になる', () => {
        // HTTP/2とHTTP/3が有効になることを確認
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                HttpVersion: 'http2and3',
            },
        });
    });

    test('CloudFormation出力が設定される', () => {
        // CloudFormation出力が設定されることを確認
        template.hasOutput('DistributionId', {
            Description: 'CloudFront Distribution ID',
            Export: {
                Name: 'janlog-distribution-id-test',
            },
        });

        template.hasOutput('DistributionDomainName', {
            Description: 'CloudFront Distribution Domain Name',
            Export: {
                Name: 'janlog-distribution-domain-test',
            },
        });

        template.hasOutput('DistributionUrl', {
            Description: 'CloudFront Distribution URL',
            Export: {
                Name: 'janlog-distribution-url-test',
            },
        });
    });

    test('スタックが正しいプロパティで作成される', () => {
        // スタックが正しい環境設定で作成されることを確認
        expect(stack.stackName).toBe('TestCloudFrontStack');
        expect(stack.region).toBe('ap-northeast-1');
    });

    test('distributionプロパティが公開される', () => {
        // distributionプロパティが公開されることを確認
        expect(stack.distribution).toBeDefined();
    });
});
