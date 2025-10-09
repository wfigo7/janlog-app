# 監視・ログ強化計画

## 現状分析

### 実装済み（development環境）
- ✅ API Gateway: アクセスログ（CloudWatch Logs、保持期間7日）
- ✅ Cognito: 認証ログ（CloudTrail経由、保持期間90日）
- ✅ Lambda: 実行ログ（CloudWatch Logs、保持期間7日）
- ✅ Lambda: ログレベル設定（DEBUG）
- ✅ Lambda: Powertools環境変数設定

### 実装済み（production環境のみ）
- ✅ Lambda: エラーアラート（5分間に5回以上）
- ✅ Lambda: 実行時間アラート（平均5秒以上）
- ✅ Lambda: スロットリングアラート（5分間に5回以上）
- ✅ DynamoDB: 読み取りスロットリングアラート
- ✅ DynamoDB: 書き込みスロットリングアラート
- ✅ API Gateway: 4xxエラー率アラート（5分間に50回以上）
- ✅ API Gateway: 5xxエラー率アラート（5分間に10回以上）
- ✅ SNS: アラート通知トピック

### 未実装（将来実装）
- ❌ Lambda: 構造化ログ（AWS Lambda Powertools導入）
- ❌ 統合ダッシュボード
- ❌ X-Ray トレーシング
- ❌ DynamoDB Contributor Insights
- ❌ S3 アクセスログ

## 優先度別改善項目

### 🔴 高優先度（即座に実装すべき）

#### 1. Lambda実行ログの構造化

**現状の問題**:
- ログが非構造化（print文のみ）
- エラー追跡が困難
- リクエストIDとの紐付けが不明確

**改善案**:
```typescript
// Lambda関数にログレベル設定を追加
environment: {
  LOG_LEVEL: environment === 'production' ? 'INFO' : 'DEBUG',
  POWERTOOLS_SERVICE_NAME: 'janlog-api',
  POWERTOOLS_METRICS_NAMESPACE: 'Janlog',
}
```

**バックエンド側の対応**:
- AWS Lambda Powertools for Pythonの導入
- 構造化ログの実装（JSON形式）
- リクエストIDの自動付与
- エラートレーシング

#### 2. Lambda CloudWatch Logsの保持期間設定

**現状の問題**:
- ログの保持期間が無期限（コスト増加）

**改善案**:
```typescript
// Lambda関数のログ保持期間を設定
import * as logs from 'aws-cdk-lib/aws-logs';

const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
  logGroupName: `/aws/lambda/janlog-api-${environment}`,
  retention: environment === 'production' 
    ? logs.RetentionDays.ONE_MONTH 
    : logs.RetentionDays.ONE_WEEK,
  removalPolicy: environment === 'production'
    ? cdk.RemovalPolicy.RETAIN
    : cdk.RemovalPolicy.DESTROY,
});
```

#### 3. Lambda エラーアラート

**現状の問題**:
- エラー発生時に通知がない
- 障害検知が遅れる

**改善案**:
```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

// SNSトピック作成
const alertTopic = new sns.Topic(this, 'AlertTopic', {
  topicName: `janlog-alerts-${environment}`,
  displayName: 'Janlog Application Alerts',
});

// メール通知の追加（開発者のメールアドレス）
alertTopic.addSubscription(
  new subscriptions.EmailSubscription('your-email@example.com')
);

// Lambda エラーアラーム
const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
  metric: lambdaFunction.metricErrors({
    period: cdk.Duration.minutes(5),
  }),
  threshold: 5, // 5分間に5回以上エラー
  evaluationPeriods: 1,
  alarmDescription: 'Lambda function error rate is too high',
  alarmName: `janlog-lambda-errors-${environment}`,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
```

### 🟡 中優先度（早めに実装すべき）

#### 4. DynamoDB スロットリングアラート

**改善案**:
```typescript
// DynamoDB読み取りスロットリングアラーム
const readThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoDBReadThrottleAlarm', {
  metric: mainTable.metricUserErrors({
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'DynamoDB read throttling detected',
  alarmName: `janlog-dynamodb-read-throttle-${environment}`,
});

// DynamoDB書き込みスロットリングアラーム
const writeThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoDBWriteThrottleAlarm', {
  metric: mainTable.metricSystemErrorsForOperations({
    operations: [dynamodb.Operation.PUT_ITEM, dynamodb.Operation.UPDATE_ITEM],
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'DynamoDB write throttling detected',
  alarmName: `janlog-dynamodb-write-throttle-${environment}`,
});
```

#### 5. API Gateway エラー率アラート

**改善案**:
```typescript
// 4xxエラー率アラーム
const clientErrorAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
  metric: httpApi.metricClientError({
    period: cdk.Duration.minutes(5),
  }),
  threshold: 50, // 5分間に50回以上
  evaluationPeriods: 2,
  alarmDescription: 'API Gateway 4xx error rate is too high',
  alarmName: `janlog-api-4xx-errors-${environment}`,
});

// 5xxエラー率アラーム
const serverErrorAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
  metric: httpApi.metricServerError({
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10, // 5分間に10回以上
  evaluationPeriods: 1,
  alarmDescription: 'API Gateway 5xx error rate is too high',
  alarmName: `janlog-api-5xx-errors-${environment}`,
});
```

#### 6. Lambda パフォーマンスメトリクス

**改善案**:
```typescript
// Lambda実行時間アラーム
const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
  metric: lambdaFunction.metricDuration({
    period: cdk.Duration.minutes(5),
    statistic: 'Average',
  }),
  threshold: 5000, // 5秒以上
  evaluationPeriods: 2,
  alarmDescription: 'Lambda function duration is too high',
  alarmName: `janlog-lambda-duration-${environment}`,
});

// Lambda同時実行数アラーム
const concurrentExecutionsAlarm = new cloudwatch.Alarm(this, 'LambdaConcurrentExecutionsAlarm', {
  metric: lambdaFunction.metricConcurrentExecutions({
    period: cdk.Duration.minutes(1),
  }),
  threshold: 50, // 同時実行数50以上
  evaluationPeriods: 2,
  alarmDescription: 'Lambda concurrent executions is too high',
  alarmName: `janlog-lambda-concurrent-${environment}`,
});
```

### 🟢 低優先度（将来実装）

#### 7. CloudWatch ダッシュボード

**改善案**:
```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

const dashboard = new cloudwatch.Dashboard(this, 'JanlogDashboard', {
  dashboardName: `janlog-dashboard-${environment}`,
});

// API Gatewayメトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'API Gateway Requests',
    left: [
      httpApi.metricCount(),
      httpApi.metricClientError(),
      httpApi.metricServerError(),
    ],
  })
);

// Lambdaメトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Lambda Performance',
    left: [
      lambdaFunction.metricInvocations(),
      lambdaFunction.metricErrors(),
      lambdaFunction.metricDuration(),
    ],
  })
);

// DynamoDBメトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'DynamoDB Operations',
    left: [
      mainTable.metricConsumedReadCapacityUnits(),
      mainTable.metricConsumedWriteCapacityUnits(),
    ],
  })
);
```

#### 8. X-Ray トレーシング

**改善案**:
```typescript
// Lambda関数でX-Rayを有効化
this.lambdaFunction = new lambda.Function(this, 'JanlogApiFunction', {
  // ... 既存の設定
  tracing: lambda.Tracing.ACTIVE,
});

// API GatewayでX-Rayを有効化（L1 Constructで設定）
const cfnStage = httpApi.defaultStage?.node.defaultChild as apigatewayv2.CfnStage;
if (cfnStage) {
  cfnStage.defaultRouteSettings = {
    ...cfnStage.defaultRouteSettings,
    tracingEnabled: true,
  };
}
```

#### 9. DynamoDB Contributor Insights

**改善案**:
```typescript
// DynamoDBのContributor Insightsを有効化
const cfnTable = mainTable.node.defaultChild as dynamodb.CfnTable;
cfnTable.contributorInsightsSpecification = {
  enabled: environment === 'production',
};
```

#### 10. S3 アクセスログ

**改善案**:
```typescript
// S3アクセスログ用バケット
const logBucket = new s3.Bucket(this, 'LogBucket', {
  bucketName: `janlog-logs-${environment}-${this.account}`,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  lifecycleRules: [
    {
      expiration: cdk.Duration.days(90),
    },
  ],
});

// メインバケットにアクセスログを設定
const mainBucket = new s3.Bucket(this, 'MainBucket', {
  // ... 既存の設定
  serverAccessLogsBucket: logBucket,
  serverAccessLogsPrefix: 'main-bucket-logs/',
});
```

## 実装順序

### フェーズ1: 基本的な監視（即座に実装）
1. Lambda CloudWatch Logsの保持期間設定
2. Lambda実行ログの構造化（バックエンド側）
3. Lambda エラーアラート

### フェーズ2: 包括的な監視（1-2週間以内）
4. DynamoDB スロットリングアラート
5. API Gateway エラー率アラート
6. Lambda パフォーマンスメトリクス

### フェーズ3: 高度な監視（将来）
7. CloudWatch ダッシュボード
8. X-Ray トレーシング
9. DynamoDB Contributor Insights
10. S3 アクセスログ

## コスト見積もり

### 追加コスト（月額、development環境）
- CloudWatch Logs（Lambda）: ~$1-2
- CloudWatch Alarms: ~$0.10/アラーム × 10 = $1
- SNS通知: ~$0.50
- X-Ray（将来）: ~$5-10
- **合計**: ~$2-4/月（現在）、~$7-14/月（将来）

### 追加コスト（月額、production環境）
- CloudWatch Logs（Lambda）: ~$5-10
- CloudWatch Alarms: ~$0.10/アラーム × 10 = $1
- SNS通知: ~$0.50
- CloudWatch Dashboard: $3/月
- X-Ray（将来）: ~$10-20
- **合計**: ~$6-12/月（現在）、~$14-34/月（将来）

## 関連ドキュメント

- [AWS Lambda Powertools for Python](https://docs.powertools.aws.dev/lambda/python/)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [AWS X-Ray](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html)
- [DynamoDB Monitoring](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/monitoring-cloudwatch.html)
