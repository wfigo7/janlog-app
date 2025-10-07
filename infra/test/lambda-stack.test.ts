// test/lambda-stack.image.test.ts
import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { DynamoDBStack } from '../lib/stacks/dynamodb-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { defaultStackProps } from '../lib/common/stack-props';

describe('LambdaStack (ECR image based)', () => {
    let app: cdk.App;
    let dynamodbStack: DynamoDBStack;
    let cognitoStack: CognitoStack;
    let ecrRepo: ecr.Repository;
    let lambdaStack: LambdaStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();

        // 依存スタック
        dynamodbStack = new DynamoDBStack(app, 'TestDynamoDBStack', {
            ...defaultStackProps,
            environment: 'test',
        });

        cognitoStack = new CognitoStack(app, 'TestCognitoStack', {
            ...defaultStackProps,
            environment: 'test',
        });

        // テスト用のECRリポジトリ（CFN上のリソースとして作るだけ。ビルド/プルは発生しない）
        const ecrStack = new cdk.Stack(app, 'TestEcrStack', {
            ...defaultStackProps,
        });
        ecrRepo = new ecr.Repository(ecrStack, 'TestEcrRepo', {
            repositoryName: 'janlog-api-test',
        });

        // 対象スタック
        lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
            ...defaultStackProps,
            environment: 'test',
            dynamodbTable: dynamodbStack.mainTable,
            userPool: cognitoStack.userPool,
            userPoolClient: cognitoStack.userPoolClient,
            ecrRepository: ecrRepo,
        });

        template = Template.fromStack(lambdaStack);
    });

    test('Lambda関数が1つ作成される', () => {
        template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('Lambda関数名が正しい', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'janlog-api-test',
        });
    });

    test('パッケージタイプがImageで、x86_64・Timeout/Memoryが正しい', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            PackageType: 'Image',
            Architectures: ['x86_64'],
            Timeout: 30,
            MemorySize: 1024,
        });
    });

    test('ECRイメージURI（:latest）を使ってデプロイされる（構造の一部を検証）', () => {
        // Code.ImageUri は複雑なFn::Joinになるので、:latestが含まれることを確認
        template.hasResourceProperties('AWS::Lambda::Function', {
            Code: {
                ImageUri: Match.objectLike({
                    'Fn::Join': [
                        '',
                        Match.arrayWith([':latest']),
                    ],
                }),
            },
        });
    });

    test('環境変数が正しく設定される', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    ENVIRONMENT: 'test',
                    // 他の環境変数はFn::ImportValueオブジェクトになるので、存在確認のみ
                    DYNAMODB_TABLE_NAME: Match.anyValue(),
                    COGNITO_USER_POOL_ID: Match.anyValue(),
                    COGNITO_CLIENT_ID: Match.anyValue(),
                },
            },
        });
    });

    test('IAMロールの信頼ポリシーが正しい', () => {
        template.resourceCountIs('AWS::IAM::Role', 1);
        template.hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: { Service: 'lambda.amazonaws.com' },
                    },
                ],
            },
            // マネージドポリシーが存在することを確認
            ManagedPolicyArns: Match.anyValue(),
        });
    });

    test('DynamoDBとECRの権限がロールに付与されている（インラインポリシーの一部を検証）', () => {
        // grantReadWriteData + grantPull の双方が1つの IAM::Policy に入る想定
        template.resourceCountIs('AWS::IAM::Policy', 1);

        // より柔軟なテスト：必要なアクションが含まれていることを個別に確認
        const policyTemplate = template.findResources('AWS::IAM::Policy');
        const policyResource = Object.values(policyTemplate)[0] as any;
        const statements = policyResource.Properties.PolicyDocument.Statement;

        // DynamoDBアクションを含むステートメントが存在することを確認
        const dynamoStatement = statements.find((stmt: any) =>
            stmt.Action.some((action: string) => action.startsWith('dynamodb:'))
        );
        expect(dynamoStatement).toBeDefined();
        expect(dynamoStatement.Effect).toBe('Allow');
        expect(dynamoStatement.Action).toEqual(expect.arrayContaining([
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
        ]));

        // ECRアクションを含むステートメントが存在することを確認
        const ecrStatement = statements.find((stmt: any) =>
            stmt.Action.some((action: string) => action.startsWith('ecr:'))
        );
        expect(ecrStatement).toBeDefined();
        expect(ecrStatement.Effect).toBe('Allow');
        expect(ecrStatement.Action).toEqual(expect.arrayContaining([
            'ecr:BatchGetImage',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchCheckLayerAvailability',
        ]));
    });

    test('タグ Component=API が付与されている', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Tags: Match.arrayWith([
                Match.objectLike({ Key: 'Component', Value: 'API' }),
            ]),
        });
    });

    test('CloudFormation出力が設定される', () => {
        template.hasOutput('LambdaFunctionName', {
            Description: 'Lambda Function Name',
            Export: {
                Name: 'JanlogLambdaFunctionName-test',
            },
        });
        template.hasOutput('LambdaFunctionArn', {
            Description: 'Lambda Function ARN',
            Export: {
                Name: 'JanlogLambdaFunctionArn-test',
            },
        });
    });

    test('スタック基本プロパティの確認', () => {
        expect(lambdaStack.stackName).toBe('TestLambdaStack');
        expect(lambdaStack.region).toBe('ap-northeast-1');
        expect(lambdaStack.lambdaFunction).toBeDefined();
        expect(lambdaStack.lambdaFunction.functionName).toBeDefined();
    });

    test('development 環境でも同様に動作', () => {
        const devApp = new cdk.App();

        const devDynamo = new DynamoDBStack(devApp, 'DevDynamoDBStack', {
            ...defaultStackProps,
            environment: 'development',
        });
        const devCognito = new CognitoStack(devApp, 'DevCognitoStack', {
            ...defaultStackProps,
            environment: 'development',
        });

        // ECRリポジトリは適切なStackスコープ内で作成
        const devEcrStack = new cdk.Stack(devApp, 'DevEcrStack', {
            ...defaultStackProps,
        });
        const devRepo = new ecr.Repository(devEcrStack, 'DevEcrRepo', {
            repositoryName: 'janlog-dev-repo',
        });

        const devLambda = new LambdaStack(devApp, 'DevLambdaStack', {
            ...defaultStackProps,
            environment: 'development',
            dynamodbTable: devDynamo.mainTable,
            userPool: devCognito.userPool,
            userPoolClient: devCognito.userPoolClient,
            ecrRepository: devRepo,
        });

        const devTemplate = Template.fromStack(devLambda);

        devTemplate.resourceCountIs('AWS::Lambda::Function', 1);
        devTemplate.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'janlog-api-development',
            PackageType: 'Image',
        });
    });
});
