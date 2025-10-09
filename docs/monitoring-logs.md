# 監視・ログ設定ガイド

## 概要

Janlogアプリケーションでは、API GatewayとCognitoのログをCloudWatch Logsに記録しています。
これにより、API通信のエラーや認証の問題をデバッグできます。

## ログの種類

### 1. API Gatewayアクセスログ

**ロググループ名**: `/aws/apigateway/janlog-api-{environment}`

**記録される情報**:
- リクエストID
- クライアントIP
- リクエスト時刻
- HTTPメソッド
- ルートキー（エンドポイント）
- ステータスコード
- レスポンスサイズ
- エラーメッセージ（該当する場合）
- 認証エラー（該当する場合）
- 統合エラー（Lambda実行エラー等）

**保持期間**:
- development環境: 7日間
- production環境: 30日間

### 2. Cognito認証ログ（CloudTrail経由）

**ログの場所**: AWS CloudTrail

**記録される情報**:
- ログイン成功/失敗（InitiateAuth）
- パスワードリセット（ForgotPassword）
- ユーザー作成（AdminCreateUser）
- トークン発行（RespondToAuthChallenge）
- 認証エラー（NotAuthorizedException等）
- ユーザーID（sub）
- クライアントIP
- エラーコードとメッセージ

**保持期間**:
- CloudTrail: 90日間（デフォルト）

**注意**: Cognitoの認証イベントは、CloudWatch Logsではなく、CloudTrailに記録されます。
より詳細なログが必要な場合は、Lambda Triggersを使用してカスタムログを実装できます。

## ログの確認方法

### AWS CLIを使用する方法

#### 最新のログを確認（リアルタイム）

```bash
# API Gatewayログ
aws logs tail /aws/apigateway/janlog-api-development --region ap-northeast-1 --follow
```

#### 過去のログを確認

```bash
# 過去10分間のログ
aws logs tail /aws/apigateway/janlog-api-development --region ap-northeast-1 --since 10m

# 過去1時間のログ
aws logs tail /aws/apigateway/janlog-api-development --region ap-northeast-1 --since 1h

# 特定の時間範囲のログ
aws logs tail /aws/apigateway/janlog-api-development --region ap-northeast-1 \
  --since "2025-10-09T07:00:00" --until "2025-10-09T08:00:00"
```

#### Cognito認証ログを確認（CloudTrail）

```bash
# 最新のInitiateAuth（ログイン試行）イベントを確認
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=InitiateAuth \
  --region ap-northeast-1 \
  --max-results 10

# 最新のAdminCreateUser（ユーザー作成）イベントを確認
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AdminCreateUser \
  --region ap-northeast-1 \
  --max-results 10

# 特定のイベントの詳細を確認（JSON整形）
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=InitiateAuth \
  --region ap-northeast-1 \
  --max-results 1 \
  --query 'Events[0].CloudTrailEvent' \
  --output text | python -m json.tool
```

#### ログストリームの一覧を確認

```bash
# API Gatewayのログストリーム
aws logs describe-log-streams \
  --log-group-name /aws/apigateway/janlog-api-development \
  --region ap-northeast-1 \
  --order-by LastEventTime \
  --descending \
  --max-items 10
```

#### 特定のログストリームの内容を確認

```bash
aws logs get-log-events \
  --log-group-name /aws/apigateway/janlog-api-development \
  --log-stream-name "p9ujawfcfd_.default-2025-10-09-07-34" \
  --region ap-northeast-1 \
  --limit 50
```

### AWS Management Consoleを使用する方法

#### API Gatewayログ

1. AWS Management Consoleにログイン
2. CloudWatch サービスに移動
3. 左メニューから「ログ」→「ロググループ」を選択
4. `/aws/apigateway/janlog-api-development`を選択
5. ログストリームを選択して内容を確認

#### Cognitoログ（CloudTrail）

1. AWS Management Consoleにログイン
2. CloudTrail サービスに移動
3. 左メニューから「イベント履歴」を選択
4. フィルターで以下を設定：
   - イベント名: `InitiateAuth`（ログイン試行）
   - イベント名: `AdminCreateUser`（ユーザー作成）
   - イベント名: `RespondToAuthChallenge`（認証チャレンジ）
5. イベントを選択して詳細を確認

### ログのフィルタリング

#### API Gatewayログ（CloudWatch Logs Insights）

CloudWatch Logs Insightsを使用して、ログをクエリできます。

**エラーのみを抽出**:
```
fields @timestamp, @message
| filter status >= 400
| sort @timestamp desc
| limit 100
```

**特定のエンドポイントのログを抽出**:
```
fields @timestamp, httpMethod, routeKey, status, responseLength
| filter routeKey like /matches/
| sort @timestamp desc
| limit 100
```

**認証エラーを抽出**:
```
fields @timestamp, @message
| filter authorizerError != "-"
| sort @timestamp desc
| limit 100
```

#### Cognitoログ（CloudTrail）

**認証失敗のみを抽出**:
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=InitiateAuth \
  --region ap-northeast-1 \
  --max-results 50 \
  --query 'Events[?contains(CloudTrailEvent, `NotAuthorizedException`)]'
```

**特定のユーザーのイベントを抽出**:
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=test@example.com \
  --region ap-northeast-1 \
  --max-results 50
```

## トラブルシューティング

### ログが表示されない場合

#### API Gatewayログ

1. **ロググループが作成されているか確認**
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /aws/apigateway/janlog --region ap-northeast-1
   ```

2. **API Gatewayにリクエストを送信**
   ```bash
   curl -X GET https://p9ujawfcfd.execute-api.ap-northeast-1.amazonaws.com/health
   ```

3. **数秒待ってから再度ログを確認**
   ログの記録には数秒〜数十秒かかる場合があります。

#### Cognitoログ

1. **CloudTrailが有効か確認**
   ```bash
   aws cloudtrail describe-trails --region ap-northeast-1
   ```

2. **認証リクエストを送信**
   ```bash
   aws cognito-idp initiate-auth \
     --auth-flow USER_PASSWORD_AUTH \
     --client-id 4u37654rhubjei088dj85clscq \
     --auth-parameters USERNAME=test@example.com,PASSWORD=TestPassword123 \
     --region ap-northeast-1
   ```

3. **数分待ってからCloudTrailを確認**
   CloudTrailのイベントは、数分遅延する場合があります。

### エラーログの読み方

#### API Gatewayエラー

- `status: 400-499`: クライアントエラー（リクエストの問題）
- `status: 500-599`: サーバーエラー（バックエンドの問題）
- `authorizerError`: JWT認証エラー
- `integrationErrorMessage`: Lambda実行エラー

#### Cognitoエラー（CloudTrail）

- `NotAuthorizedException`: 認証失敗（パスワード間違い等）
- `UserNotFoundException`: ユーザーが存在しない
- `InvalidParameterException`: パラメータエラー
- `UserNotConfirmedException`: ユーザーが確認されていない
- `PasswordResetRequiredException`: パスワードリセットが必要

**CloudTrailイベントの確認方法**:
```bash
# エラーコードを含むイベントを確認
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=InitiateAuth \
  --region ap-northeast-1 \
  --max-results 1 \
  --query 'Events[0].CloudTrailEvent' \
  --output text | python -m json.tool | grep -A 2 errorCode
```

## 監視アラートの設定（将来実装）

CloudWatch Alarmsを使用して、エラー率が高い場合にアラートを送信できます。

```typescript
// 例: エラー率が10%を超えた場合にアラート
const errorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
  metric: httpApi.metricServerError(),
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'API Gateway error rate is too high',
});
```

## ログ出力例

### API Gatewayアクセスログ

```json
{
  "requestId": "SKzNJiOjNjMEMEQ=",
  "ip": "167.103.14.127",
  "requestTime": "09/Oct/2025:07:34:30 +0000",
  "httpMethod": "GET",
  "routeKey": "GET /health",
  "status": "200",
  "protocol": "HTTP/1.1",
  "responseLength": "163",
  "errorMessage": "-",
  "errorMessageString": "-",
  "authorizerError": "-",
  "integrationErrorMessage": "-"
}
```

### Cognito認証失敗ログ（CloudTrail）

```json
{
  "eventVersion": "1.10",
  "eventTime": "2025-10-09T07:57:09Z",
  "eventSource": "cognito-idp.amazonaws.com",
  "eventName": "InitiateAuth",
  "awsRegion": "ap-northeast-1",
  "sourceIPAddress": "167.103.14.127",
  "errorCode": "NotAuthorizedException",
  "errorMessage": "Incorrect username or password.",
  "requestParameters": {
    "authFlow": "USER_PASSWORD_AUTH",
    "authParameters": "HIDDEN_DUE_TO_SECURITY_REASONS",
    "clientId": "4u37654rhubjei088dj85clscq"
  },
  "additionalEventData": {
    "sub": "87a42a58-6051-7076-79e2-fe9208b6ae3c"
  }
}
```

## 関連ドキュメント

- [AWS CloudWatch Logs ドキュメント](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [API Gateway アクセスログ](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-logging.html)
- [AWS CloudTrail ドキュメント](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/)
- [Cognito CloudTrail ログ](https://docs.aws.amazon.com/cognito/latest/developerguide/logging-using-cloudtrail.html)
