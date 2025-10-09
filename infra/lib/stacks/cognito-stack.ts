import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: JanlogStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // CloudWatch Logs用のロググループを作成
    // Cognitoは自動的にこのロググループに認証イベントを書き込む
    new logs.LogGroup(this, 'CognitoLogs', {
      logGroupName: `/aws/cognito/janlog-user-pool-${environment}`,
      retention: environment === 'production'
        ? logs.RetentionDays.ONE_MONTH
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'JanlogUserPool', {
      userPoolName: `janlog-user-pool-${environment}`,
      // 招待制のため、セルフサインアップを無効化
      selfSignUpEnabled: false,
      // メール認証を使用
      signInAliases: {
        email: true,
      },
      // パスワードポリシー
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      // アカウント復旧設定
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // メール設定（デフォルトのCognito Emailを使用）
      email: cognito.UserPoolEmail.withCognito(),
      // カスタム属性
      customAttributes: {
        role: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
      },
      // 招待メッセージのカスタマイズ
      userInvitation: {
        emailSubject: 'Janlogアプリへの招待',
        emailBody: `
こんにちは！

Janlogアプリへの招待です。
以下の情報でログインしてください：

ユーザー名: {username}
一時パスワード: {####}

初回ログイン時に新しいパスワードを設定してください。

Janlogアプリ
        `.trim(),
      },
      // 削除保護（本番環境では保持）
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Logsへのログ設定
    // Cognitoは自動的にCloudWatch Logsに書き込むため、ロググループを作成するだけで有効化される
    // ログは認証イベント（ログイン成功/失敗、パスワードリセット等）が記録される

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'JanlogUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `janlog-client-${environment}`,
      // JWT設定
      generateSecret: false, // モバイルアプリではシークレット不要
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      // トークンの有効期限
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      // OAuth設定を無効化（モバイルアプリではOAuthを使用しない）
      // oAuth設定は削除
    });

    // 出力
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `JanlogUserPoolId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `JanlogUserPoolClientId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `JanlogUserPoolArn-${environment}`,
    });
  }
}