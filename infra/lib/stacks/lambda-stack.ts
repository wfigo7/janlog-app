import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
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

    // CloudWatch Logs用のロググループを作成（保持期間設定）
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/janlog-api-${environment}`,
      retention: environment === 'production' 
        ? logs.RetentionDays.ONE_MONTH 
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

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

        // ログ設定
        LOG_LEVEL: environment === 'production' ? 'INFO' : 'DEBUG',
        POWERTOOLS_SERVICE_NAME: 'janlog-api',
        POWERTOOLS_METRICS_NAMESPACE: 'Janlog',
      },

      // リソース設定
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024, // コンテナベースでは少し多めに設定

      // IAMロール
      role: lambdaRole,
    });

    // タグ設定
    cdk.Tags.of(this.lambdaFunction).add('Component', 'API');

    // アラート用SNSトピック（development環境では作成しない）
    if (environment === 'production') {
      const alertTopic = new sns.Topic(this, 'AlertTopic', {
        topicName: `janlog-alerts-${environment}`,
        displayName: 'Janlog Application Alerts',
      });

      // TODO: 本番環境では実際のメールアドレスを設定
      // alertTopic.addSubscription(
      //   new subscriptions.EmailSubscription('your-email@example.com')
      // );

      // Lambda エラーアラーム
      const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
        metric: this.lambdaFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5, // 5分間に5回以上エラー
        evaluationPeriods: 1,
        alarmDescription: 'Lambda function error rate is too high',
        alarmName: `janlog-lambda-errors-${environment}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // Lambda実行時間アラーム
      const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
        metric: this.lambdaFunction.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 5000, // 5秒以上
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function duration is too high',
        alarmName: `janlog-lambda-duration-${environment}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // Lambda スロットリングアラーム
      const throttlesAlarm = new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
        metric: this.lambdaFunction.metricThrottles({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5, // 5分間に5回以上スロットリング
        evaluationPeriods: 1,
        alarmDescription: 'Lambda function is being throttled',
        alarmName: `janlog-lambda-throttles-${environment}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      throttlesAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // 出力
      new cdk.CfnOutput(this, 'AlertTopicArn', {
        value: alertTopic.topicArn,
        description: 'SNS Topic ARN for Alerts',
        exportName: `JanlogAlertTopicArn-${environment}`,
      });
    }

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