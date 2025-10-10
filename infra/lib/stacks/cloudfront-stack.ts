import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { JanlogStackProps } from './../common/stack-props';

export interface CloudFrontStackProps extends JanlogStackProps {
    frontendBucketName: string;
}

export class CloudFrontStack extends cdk.Stack {
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
        super(scope, id, props);

        const { environment, frontendBucketName } = props;

        // バケット名からインポート（循環参照を回避）
        const frontendBucket = s3.Bucket.fromBucketName(
            this,
            'ImportedFrontendBucket',
            frontendBucketName
        );

        // CloudFront Distribution の作成
        this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
            comment: `Janlog Frontend Distribution (${environment})`,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: true,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            },
            defaultRootObject: 'index.html',
            // SPA対応: 404エラーをindex.htmlにリダイレクト
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],
            priceClass: cloudfront.PriceClass.PRICE_CLASS_200, // アジア・北米・ヨーロッパ
            enabled: true,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        });

        // S3BucketOrigin.withOriginAccessControlを使用すると、
        // OACとバケットポリシーが自動的に設定されます

        // 出力
        new cdk.CfnOutput(this, 'DistributionId', {
            value: this.distribution.distributionId,
            description: 'CloudFront Distribution ID',
            exportName: `janlog-distribution-id-${environment}`,
        });

        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: this.distribution.distributionDomainName,
            description: 'CloudFront Distribution Domain Name',
            exportName: `janlog-distribution-domain-${environment}`,
        });

        new cdk.CfnOutput(this, 'DistributionUrl', {
            value: `https://${this.distribution.distributionDomainName}`,
            description: 'CloudFront Distribution URL',
            exportName: `janlog-distribution-url-${environment}`,
        });
    }
}
