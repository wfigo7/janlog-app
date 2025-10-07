import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export interface LambdaStackProps extends JanlogStackProps {
  dynamodbTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  ecrRepository: ecr.Repository;
}

export class LambdaStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { environment, dynamodbTable, userPool, userPoolClient, ecrRepository } = props;

    // Lambda実行ロール
    const lambdaRole = new iam.Role(this, 'JanlogLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDB読み書き権限を追加
    dynamodbTable.grantReadWriteData(lambdaRole);

    // ECR読み取り権限を追加
    ecrRepository.grantPull(lambdaRole);

    // Lambda関数の作成（コンテナイメージベース）
    this.lambdaFunction = new lambda.Function(this, 'JanlogApiFunction', {
      functionName: `janlog-api-${environment}`,
      code: lambda.Code.fromEcrImage(ecrRepository, {
        tagOrDigest: 'latest',
      }),
      handler: lambda.Handler.FROM_IMAGE,
      runtime: lambda.Runtime.FROM_IMAGE,
      architecture: lambda.Architecture.X86_64,

      // 環境変数
      environment: {
        // アプリケーション設定
        ENVIRONMENT: environment,
        DYNAMODB_TABLE_NAME: dynamodbTable.tableName,

        // Cognito設定（AWS環境用）
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
      },

      // リソース設定
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024, // コンテナベースでは少し多めに設定

      // IAMロール
      role: lambdaRole,
    });

    // タグ設定
    cdk.Tags.of(this.lambdaFunction).add('Component', 'API');

    // 出力
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `JanlogLambdaFunctionName-${environment}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `JanlogLambdaFunctionArn-${environment}`,
    });


  }
}