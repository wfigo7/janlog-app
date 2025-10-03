import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { DynamoDBStack } from '../lib/stacks/dynamodb-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { defaultStackProps } from '../lib/common/stack-props';

// PythonFunctionのDockerビルドを無効化するためのモック
jest.mock('@aws-cdk/aws-lambda-python-alpha', () => {
    const actual = jest.requireActual('aws-cdk-lib/aws-lambda');
    return {
        PythonFunction: class MockPythonFunction extends actual.Function {
            constructor(scope: Construct, id: string, props: lambda.FunctionProps & { entry?: string; index?: string; bundling?: unknown }) {
                // PythonFunctionの代わりに通常のFunctionを使用（テスト用）
                const mockProps: lambda.FunctionProps = {
                    ...props,
                    code: actual.Code.fromInline('def lambda_handler(event, context): return {"statusCode": 200}'),
                    handler: 'index.lambda_handler',
                    runtime: actual.Runtime.PYTHON_3_12,
                };
                // PythonFunction固有のプロパティを削除
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { entry, index, bundling, ...cleanProps } = props;
                super(scope, id, { ...cleanProps, ...mockProps });
            }
        }
    };
});

describe('LambdaStack', () => {
    let app: cdk.App;
    let dynamodbStack: DynamoDBStack;
    let cognitoStack: CognitoStack;
    let lambdaStack: LambdaStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();

        // 依存スタックを作成
        dynamodbStack = new DynamoDBStack(app, 'TestDynamoDBStack', {
            ...defaultStackProps,
            environment: 'test',
        });

        cognitoStack = new CognitoStack(app, 'TestCognitoStack', {
            ...defaultStackProps,
            environment: 'test',
        });

        // Lambdaスタックを作成
        lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
            ...defaultStackProps,
            environment: 'test',
            dynamodbTable: dynamodbStack.mainTable,
            userPool: cognitoStack.userPool,
            userPoolClient: cognitoStack.userPoolClient,
        });

        template = Template.fromStack(lambdaStack);
    });

    test('Lambda関数が作成される', () => {
        // Lambda関数が1つ作成されることを確認
        template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('Lambda関数名が正しく設定される', () => {
        // Lambda関数名が環境に応じて設定されることを確認
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'janlog-api-test',
        });
    });

    test('Python 3.12ランタイムが設定される', () => {
        // Python 3.12ランタイムが設定されることを確認（PythonFunctionでサポートされている最新版）
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'python3.12',
        });
    });

    test('Lambda Web Adapterレイヤーが設定される', () => {
        // LWAレイヤーが設定されることを確認
        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: [
                'arn:aws:lambda:ap-northeast-1:753240598075:layer:LambdaAdapterLayerX86:20'
            ],
        });
    });

    test('環境変数が正しく設定される', () => {
        // 環境変数が正しく設定されることを確認
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    AWS_LWA_INVOKE_MODE: 'RESPONSE_STREAM',
                    AWS_LWA_PORT: '8000',
                    ENVIRONMENT: 'test',
                    PYTHONPATH: '/var/task',
                },
            },
        });
    });

    test('アーキテクチャがx86_64に設定される', () => {
        // アーキテクチャがx86_64に設定されることを確認
        template.hasResourceProperties('AWS::Lambda::Function', {
            Architectures: ['x86_64'],
        });
    });

    test('タイムアウトとメモリサイズが設定される', () => {
        // タイムアウトとメモリサイズが設定されることを確認
        template.hasResourceProperties('AWS::Lambda::Function', {
            Timeout: 30,
            MemorySize: 512,
        });
    });

    test('IAMロールが作成される', () => {
        // IAMロールが作成されることを確認
        template.resourceCountIs('AWS::IAM::Role', 1);

        template.hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                    },
                ],
            },
        });
    });

    test('DynamoDB読み書き権限が設定される', () => {
        // DynamoDB読み書き権限のIAMポリシーが作成されることを確認
        template.resourceCountIs('AWS::IAM::Policy', 1);

        // DynamoDBアクションが含まれていることを確認
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: [
                    {
                        Action: [
                            'dynamodb:BatchGetItem',
                            'dynamodb:GetRecords',
                            'dynamodb:GetShardIterator',
                            'dynamodb:Query',
                            'dynamodb:GetItem',
                            'dynamodb:Scan',
                            'dynamodb:ConditionCheckItem',
                            'dynamodb:BatchWriteItem',
                            'dynamodb:PutItem',
                            'dynamodb:UpdateItem',
                            'dynamodb:DeleteItem',
                            'dynamodb:DescribeTable',
                        ],
                        Effect: 'Allow',
                    },
                ],
            },
        });
    });

    test('CloudFormation出力が設定される', () => {
        // CloudFormation出力が設定されることを確認
        template.hasOutput('LambdaFunctionName', {
            Description: 'Lambda Function Name',
        });

        template.hasOutput('LambdaFunctionArn', {
            Description: 'Lambda Function ARN',
        });
    });

    test('lambdaFunctionプロパティが正しく設定される', () => {
        // lambdaFunctionプロパティがLambda関数インスタンスであることを確認
        expect(lambdaStack.lambdaFunction).toBeDefined();
        // CDKトークンのため、実際の関数名の検証はCloudFormationテンプレートで行う
        expect(lambdaStack.lambdaFunction.functionName).toBeDefined();
    });

    test('スタックが正しいプロパティで作成される', () => {
        // スタックが正しい環境設定で作成されることを確認
        expect(lambdaStack.stackName).toBe('TestLambdaStack');
        expect(lambdaStack.region).toBe('ap-northeast-1');
    });

    test('development環境でも正しく動作する', () => {
        // development環境用のスタックを作成
        const devApp = new cdk.App();

        const devDynamodbStack = new DynamoDBStack(devApp, 'DevDynamoDBStack', {
            ...defaultStackProps,
            environment: 'development',
        });

        const devCognitoStack = new CognitoStack(devApp, 'DevCognitoStack', {
            ...defaultStackProps,
            environment: 'development',
        });

        const devLambdaStack = new LambdaStack(devApp, 'DevLambdaStack', {
            ...defaultStackProps,
            environment: 'development',
            dynamodbTable: devDynamodbStack.mainTable,
            userPool: devCognitoStack.userPool,
            userPoolClient: devCognitoStack.userPoolClient,
        });

        const devTemplate = Template.fromStack(devLambdaStack);

        // development環境でもLambda関数が作成される
        devTemplate.resourceCountIs('AWS::Lambda::Function', 1);
        devTemplate.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'janlog-api-development',
        });
    });
});