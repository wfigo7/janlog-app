import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface GitHubOidcStackProps extends cdk.StackProps {
  /**
   * GitHub organization or user name
   */
  githubOrg: string;

  /**
   * GitHub repository name
   */
  githubRepo: string;

  /**
   * Environment name (e.g., 'development', 'production')
   */
  environment: string;
}

/**
 * Stack for GitHub Actions OIDC authentication
 * 
 * This stack creates:
 * - OIDC Identity Provider for GitHub Actions
 * - IAM Role that GitHub Actions can assume
 * - Necessary permissions for CI/CD operations
 */
export class GitHubOidcStack extends cdk.Stack {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: GitHubOidcStackProps) {
    super(scope, id, props);

    const { githubOrg, githubRepo, environment } = props;

    // OIDC Provider is shared across all environments in the same AWS account
    // We use a conditional approach: only create it for the first environment (development)
    // For other environments, we import the existing provider
    let oidcProvider: iam.IOpenIdConnectProvider;

    if (environment === 'development') {
      // Create OIDC Provider for the first environment
      // If it already exists, CDK will import it automatically
      oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: [
          // GitHub Actions OIDC thumbprint (current as of 2024)
          // AWS recommends using a single thumbprint for GitHub Actions
          // This thumbprint is for the root CA certificate
          '6938fd4d98bab03faadb97b34396831e3780aea1',
          // Additional thumbprints for certificate rotation
          '1c58a3a8518e8759bf075b76b750d4f2df264fcd',
        ],
      });
    } else {
      // For other environments (production), import the existing OIDC Provider
      // The ARN format: arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
      oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        'GitHubOidcProvider',
        `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
      );
    }

    // Create IAM Role for GitHub Actions
    this.role = new iam.Role(this, 'GitHubActionsRole', {
      roleName: `janlog-github-actions-${environment}`,
      description: `Role for GitHub Actions CI/CD in ${environment} environment`,
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            // Allow all refs from the repository (branches, tags, etc.)
            // Format: repo:OWNER/REPO:ref:refs/heads/BRANCH or repo:OWNER/REPO:environment:ENV
            'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:*`,
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add permissions for ECR (Backend deployment)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ECRPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:DescribeRepositories',
          'ecr:ListImages',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for ECR Public (Backend deployment - for pulling base images)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ECRPublicPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr-public:GetAuthorizationToken',
          'sts:GetServiceBearerToken',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for Lambda (Backend deployment)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'LambdaPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'lambda:UpdateFunctionCode',
          'lambda:GetFunction',
          'lambda:GetFunctionConfiguration',
          'lambda:PublishVersion',
          'lambda:UpdateAlias',
        ],
        resources: [`arn:aws:lambda:${this.region}:${this.account}:function:janlog-api-${environment}`],
      })
    );

    // Add permissions for S3 (Frontend Web deployment)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3Permissions',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:GetObject',
          's3:ListBucket',
          's3:DeleteObject',
        ],
        resources: [
          `arn:aws:s3:::janlog-frontend-${environment}`,
          `arn:aws:s3:::janlog-frontend-${environment}/*`,
        ],
      })
    );

    // Add permissions for CloudFront (Frontend Web deployment)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFrontPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetDistribution',
          'cloudfront:GetDistributionConfig',
          'cloudfront:ListDistributions',
          'cloudfront:GetInvalidation',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for CloudFormation (Infrastructure deployment)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFormationPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:UpdateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStackResources',
          'cloudformation:GetTemplate',
          'cloudformation:ValidateTemplate',
          'cloudformation:CreateChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:DeleteChangeSet',
          'cloudformation:ListStacks',
        ],
        resources: [
          `arn:aws:cloudformation:${this.region}:${this.account}:stack/janlog-*`,
          `arn:aws:cloudformation:${this.region}:${this.account}:stack/Janlog*`,
          `arn:aws:cloudformation:${this.region}:${this.account}:stack/CDKToolkit/*`,
        ],
      })
    );

    // Add permissions for CDK Bootstrap resources
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CDKBootstrapPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:ListBucket',
          's3:GetBucketLocation',
          's3:GetBucketPolicy',
        ],
        resources: [
          `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}`,
          `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}/*`,
        ],
      })
    );

    // Add permissions to assume CDK execution roles
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CDKAssumeRolePermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'sts:AssumeRole',
        ],
        resources: [
          `arn:aws:iam::${this.account}:role/cdk-*-deploy-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-*-file-publishing-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-*-lookup-role-${this.account}-${this.region}`,
        ],
      })
    );

    // Add permissions for IAM (Infrastructure deployment - CDK needs this)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'IAMPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:GetRole',
          'iam:PassRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:PutRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:GetRolePolicy',
          'iam:TagRole',
          'iam:UntagRole',
        ],
        resources: [
          `arn:aws:iam::${this.account}:role/janlog-*`,
          `arn:aws:iam::${this.account}:role/cdk-*`,
        ],
      })
    );

    // Add permissions for other AWS services (Infrastructure deployment)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'OtherServicesPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          // Cognito
          'cognito-idp:CreateUserPool',
          'cognito-idp:DeleteUserPool',
          'cognito-idp:DescribeUserPool',
          'cognito-idp:UpdateUserPool',
          'cognito-idp:CreateUserPoolClient',
          'cognito-idp:DeleteUserPoolClient',
          'cognito-idp:DescribeUserPoolClient',
          'cognito-idp:UpdateUserPoolClient',
          'cognito-idp:TagResource',
          'cognito-idp:UntagResource',
          // API Gateway
          'apigateway:*',
          // DynamoDB
          'dynamodb:CreateTable',
          'dynamodb:DeleteTable',
          'dynamodb:DescribeTable',
          'dynamodb:UpdateTable',
          'dynamodb:TagResource',
          'dynamodb:UntagResource',
          // Lambda (for CDK)
          'lambda:CreateFunction',
          'lambda:DeleteFunction',
          'lambda:GetFunction',
          'lambda:UpdateFunctionConfiguration',
          'lambda:TagResource',
          'lambda:UntagResource',
          'lambda:AddPermission',
          'lambda:RemovePermission',
          // ECR (for CDK)
          'ecr:CreateRepository',
          'ecr:DeleteRepository',
          'ecr:DescribeRepositories',
          'ecr:SetRepositoryPolicy',
          'ecr:DeleteRepositoryPolicy',
          'ecr:TagResource',
          'ecr:UntagResource',
          // S3 (for CDK)
          's3:CreateBucket',
          's3:DeleteBucket',
          's3:PutBucketPolicy',
          's3:DeleteBucketPolicy',
          's3:PutBucketPublicAccessBlock',
          's3:PutBucketTagging',
          's3:PutBucketWebsite',
          's3:PutBucketCORS',
          // CloudFront (for CDK)
          'cloudfront:CreateDistribution',
          'cloudfront:DeleteDistribution',
          'cloudfront:UpdateDistribution',
          'cloudfront:TagResource',
          'cloudfront:UntagResource',
          'cloudfront:CreateOriginAccessControl',
          'cloudfront:DeleteOriginAccessControl',
          'cloudfront:GetOriginAccessControl',
          'cloudfront:UpdateOriginAccessControl',
          // SSM (for CDK context)
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:PutParameter',
          'ssm:DeleteParameter',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for STS (to verify credentials)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'STSPermissions',
        effect: iam.Effect.ALLOW,
        actions: ['sts:GetCallerIdentity'],
        resources: ['*'],
      })
    );

    // Output the role ARN
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.role.roleArn,
      description: 'ARN of the IAM role for GitHub Actions',
      exportName: `janlog-github-actions-role-arn-${environment}`,
    });

    // Output instructions
    new cdk.CfnOutput(this, 'GitHubActionsSetupInstructions', {
      value: [
        'To use this role in GitHub Actions:',
        '1. Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from GitHub Secrets',
        '2. Update .github/workflows/cd.yml to use OIDC authentication',
        `3. Set the role ARN: ${this.role.roleArn}`,
      ].join('\n'),
      description: 'Instructions for setting up GitHub Actions with OIDC',
    });
  }
}
