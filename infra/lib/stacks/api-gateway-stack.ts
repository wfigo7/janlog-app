import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export interface ApiGatewayStackProps extends JanlogStackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  lambdaFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly httpApi: apigatewayv2.HttpApi;
  public readonly jwtAuthorizer: apigatewayv2.HttpAuthorizer;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const { environment, userPool, userPoolClient, lambdaFunction } = props;

    // CloudWatch Logs用のロググループを作成
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      logGroupName: `/aws/apigateway/janlog-api-${environment}`,
      retention: environment === 'production'
        ? logs.RetentionDays.ONE_MONTH
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // HTTP API Gateway（L2 Constructを使用）
    this.httpApi = new apigatewayv2.HttpApi(this, 'JanlogHttpApi', {
      apiName: `janlog-api-${environment}`,
      description: 'Janlog REST API',
      corsPreflight: {
        allowOrigins: environment === 'production'
          ? ['https://janlog.app'] // 本番では制限
          : ['*'], // 開発環境では全許可
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // JWT Authorizer（L2 Constructを使用）
    this.jwtAuthorizer = new apigatewayv2.HttpAuthorizer(this, 'JanlogJwtAuthorizer', {
      httpApi: this.httpApi,
      type: apigatewayv2.HttpAuthorizerType.JWT,
      authorizerName: 'JanlogJwtAuthorizer',
      identitySource: ['$request.header.Authorization'],
      jwtAudience: [userPoolClient.userPoolClientId],
      jwtIssuer: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
    });

    // Lambda統合の作成
    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'JanlogLambdaIntegration',
      lambdaFunction,
      {
        // プロキシ統合を有効化
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
      }
    );

    // プロキシルート（/{proxy+}）の追加（認証なし）
    // 開発・テスト用の認証なしエンドポイント
    this.httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [
        apigatewayv2.HttpMethod.GET,
        apigatewayv2.HttpMethod.POST,
        apigatewayv2.HttpMethod.PUT,
        apigatewayv2.HttpMethod.DELETE,
        apigatewayv2.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
      // 認証なし（開発・テスト用）
    });

    // ヘルスチェック用のルート（認証なし）
    this.httpApi.addRoutes({
      path: '/health',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
      // 認証なし
    });

    // 認証付きエンドポイント用のルート（/api/v1/*）
    // L2 ConstructでHttpRouteを作成し、L1でAuthorizerを設定
    const authMethods = [
      apigatewayv2.HttpMethod.GET,
      apigatewayv2.HttpMethod.POST,
      apigatewayv2.HttpMethod.PUT,
      apigatewayv2.HttpMethod.DELETE,
    ];

    const authRoutes: apigatewayv2.HttpRoute[] = [];
    authMethods.forEach(method => {
      const route = new apigatewayv2.HttpRoute(this, `JanlogHttpApi${method}ApiV1Route`, {
        httpApi: this.httpApi,
        routeKey: apigatewayv2.HttpRouteKey.with('/api/v1/{proxy+}', method),
        integration: lambdaIntegration,
      });
      authRoutes.push(route);
    });

    // L1 Constructを使用してAuthorizerを設定
    authRoutes.forEach((route) => {
      const cfnRoute = route.node.defaultChild as apigatewayv2.CfnRoute;
      cfnRoute.authorizationType = 'JWT';
      cfnRoute.authorizerId = this.jwtAuthorizer.authorizerId;
    });

    // API Gateway デプロイメント（自動デプロイ）
    // L2 Constructでは自動的にデプロイされる

    // アクセスログの設定（L1 Constructを使用）
    const defaultStage = this.httpApi.defaultStage?.node.defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      defaultStage.accessLogSettings = {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          errorMessage: '$context.error.message',
          errorMessageString: '$context.error.messageString',
          authorizerError: '$context.authorizer.error',
          integrationErrorMessage: '$context.integrationErrorMessage',
        }),
      };

      // 詳細なメトリクスを有効化
      // 注意: HTTP APIでは実行ログ（loggingLevel, dataTraceEnabled）はサポートされていない
      // アクセスログのみがサポートされる
      defaultStage.defaultRouteSettings = {
        detailedMetricsEnabled: true,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      };
    }

    // API GatewayがCloudWatch Logsに書き込む権限を付与
    apiLogGroup.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // CloudWatch Alarms（production環境のみ）
    if (environment === 'production') {
      // 4xxエラー率アラーム
      const clientErrorAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
        metric: this.httpApi.metricClientError({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 50, // 5分間に50回以上
        evaluationPeriods: 2,
        alarmDescription: 'API Gateway 4xx error rate is too high',
        alarmName: `janlog-api-4xx-errors-${environment}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // 5xxエラー率アラーム
      const serverErrorAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
        metric: this.httpApi.metricServerError({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10, // 5分間に10回以上
        evaluationPeriods: 1,
        alarmDescription: 'API Gateway 5xx error rate is too high',
        alarmName: `janlog-api-5xx-errors-${environment}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // 出力
      new cdk.CfnOutput(this, 'ClientErrorAlarmName', {
        value: clientErrorAlarm.alarmName,
        description: 'API Gateway 4xx Error Alarm Name',
      });

      new cdk.CfnOutput(this, 'ServerErrorAlarmName', {
        value: serverErrorAlarm.alarmName,
        description: 'API Gateway 5xx Error Alarm Name',
      });
    }

    // 出力
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'HTTP API Gateway URL',
      exportName: `JanlogHttpApiUrl-${environment}`,
    });

    new cdk.CfnOutput(this, 'HttpApiId', {
      value: this.httpApi.httpApiId,
      description: 'HTTP API Gateway ID',
      exportName: `JanlogHttpApiId-${environment}`,
    });

    new cdk.CfnOutput(this, 'JwtAuthorizerId', {
      value: this.jwtAuthorizer.authorizerId,
      description: 'JWT Authorizer ID',
      exportName: `JanlogJwtAuthorizerId-${environment}`,
    });
  }
}