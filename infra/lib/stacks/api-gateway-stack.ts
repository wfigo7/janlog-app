import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export interface ApiGatewayStackProps extends JanlogStackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly httpApi: apigatewayv2.CfnApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const { environment, userPool, userPoolClient } = props;

    // HTTP API Gateway（CloudFormationレベルで作成）
    this.httpApi = new apigatewayv2.CfnApi(this, 'JanlogHttpApi', {
      name: `janlog-api-${environment}`,
      description: 'Janlog REST API',
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'], // 開発環境では全許可、本番では制限
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: 86400, // 1日
      },
    });

    // JWT Authorizer（CloudFormationレベルで作成）
    const jwtAuthorizer = new apigatewayv2.CfnAuthorizer(this, 'JanlogJwtAuthorizer', {
      apiId: this.httpApi.ref,
      authorizerType: 'JWT',
      identitySource: ['$request.header.Authorization'],
      jwtConfiguration: {
        audience: [userPoolClient.userPoolClientId],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      },
      name: 'JanlogJwtAuthorizer',
    });

    // 出力
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: `https://${this.httpApi.ref}.execute-api.${this.region}.amazonaws.com`,
      description: 'HTTP API Gateway URL',
      exportName: `JanlogHttpApiUrl-${environment}`,
    });

    new cdk.CfnOutput(this, 'HttpApiId', {
      value: this.httpApi.ref,
      description: 'HTTP API Gateway ID',
      exportName: `JanlogHttpApiId-${environment}`,
    });
  }
}