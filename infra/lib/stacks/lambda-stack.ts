import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export interface LambdaStackProps extends JanlogStackProps {
  dynamodbTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class LambdaStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { environment, dynamodbTable, userPool, userPoolClient } = props;

    // Lambda実行ロール
    const lambdaRole = new iam.Role(this, 'JanlogLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDB読み書き権限を追加
    dynamodbTable.grantReadWriteData(lambdaRole);

    // Lambda関数の作成（PythonFunction使用）
    this.lambdaFunction = new lambdaPython.PythonFunction(this, 'JanlogApiFunction', {
      functionName: `janlog-api-${environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'lambda_function.lambda_handler',
      entry: '../backend',
      index: 'lambda_function.py',

      // アーキテクチャ指定
      architecture: lambda.Architecture.X86_64,

      // バンドリング設定（不要ファイルを除外）
      bundling: {
        assetExcludes: [
          'venv',
          '.venv',
          '__pycache__',
          '.pytest_cache',
          'tests',
          'manual_tests',
          'scripts',
          '.env*',
          '.envrc',
          '*.md',
          '.flake8',
          '.python-version',
          'pyproject.toml',
          'pytest.ini',
          'Makefile',
          'run_local.py',
          '.git*',
          '.vscode',
          '.idea',
          '*.log',
          '*.tmp',
          '*.temp',
        ],
      },

      // Lambda Web Adapterレイヤー
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this, 'LambdaWebAdapterLayer',
          'arn:aws:lambda:ap-northeast-1:753240598075:layer:LambdaAdapterLayerX86:20'
        )
      ],

      // 環境変数
      environment: {
        // LWA必須設定
        AWS_LWA_INVOKE_MODE: 'RESPONSE_STREAM',
        AWS_LWA_PORT: '8000',

        // アプリケーション設定
        ENVIRONMENT: environment,
        DYNAMODB_TABLE_NAME: dynamodbTable.tableName,

        // Cognito設定（AWS環境用）
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,

        // Python設定
        PYTHONPATH: '/var/task',
      },

      // リソース設定
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,

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