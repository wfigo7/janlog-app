import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DynamoDBStack } from '../lib/stacks/dynamodb-stack';
import { defaultStackProps } from '../lib/common/stack-props';

describe('DynamoDBStack', () => {
    let app: cdk.App;
    let stack: DynamoDBStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
        stack = new DynamoDBStack(app, 'TestDynamoDBStack', {
            ...defaultStackProps,
            environment: 'test',
        });
        template = Template.fromStack(stack);
    });

    test('DynamoDBテーブルが作成される', () => {
        // DynamoDBテーブルが1つ作成されることを確認
        template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('テーブル名が正しく設定される', () => {
        // テーブル名が環境に応じて設定されることを確認
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            TableName: 'janlog-table-test',
        });
    });

    test('パーティションキーとソートキーが正しく設定される', () => {
        // PKとSKが正しく設定されることを確認
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            KeySchema: [
                {
                    AttributeName: 'PK',
                    KeyType: 'HASH',
                },
                {
                    AttributeName: 'SK',
                    KeyType: 'RANGE',
                },
            ],
            AttributeDefinitions: [
                {
                    AttributeName: 'PK',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'SK',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'GSI1PK',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'GSI1SK',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'GSI2PK',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'GSI2SK',
                    AttributeType: 'S',
                },
            ],
        });
    });

    test('オンデマンド課金が設定される', () => {
        // オンデマンド課金が設定されることを確認
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            BillingMode: 'PAY_PER_REQUEST',
        });
    });

    test('GSI1が正しく設定される', () => {
        // GSI1: MATCH_BY_USER_DATEが正しく設定されることを確認
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'GSI1-MATCH_BY_USER_DATE',
                    KeySchema: [
                        {
                            AttributeName: 'GSI1PK',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'GSI1SK',
                            KeyType: 'RANGE',
                        },
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
                {
                    IndexName: 'GSI2-MATCH_BY_USER_MODE_DATE',
                    KeySchema: [
                        {
                            AttributeName: 'GSI2PK',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'GSI2SK',
                            KeyType: 'RANGE',
                        },
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
            ],
        });
    });

    test('暗号化が設定される', () => {
        // AWS管理キーによる暗号化が設定されることを確認
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            SSESpecification: {
                SSEEnabled: true,
            },
        });
    });

    test('開発環境では削除ポリシーがDestroyになる', () => {
        // 開発環境では削除ポリシーがDeleteに設定される
        template.hasResource('AWS::DynamoDB::Table', {
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
        });
    });

    test('本番環境では削除ポリシーがRetainになる', () => {
        // 本番環境用のスタックを作成
        const prodApp = new cdk.App();
        const prodStack = new DynamoDBStack(prodApp, 'ProdDynamoDBStack', {
            ...defaultStackProps,
            environment: 'production',
        });
        const prodTemplate = Template.fromStack(prodStack);

        // 本番環境では RETAIN ポリシーが設定される
        prodTemplate.hasResource('AWS::DynamoDB::Table', {
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
        });
    });

    test('本番環境ではポイントインタイムリカバリが有効になる', () => {
        // 本番環境用のスタックを作成
        const prodApp = new cdk.App();
        const prodStack = new DynamoDBStack(prodApp, 'ProdDynamoDBStack', {
            ...defaultStackProps,
            environment: 'production',
        });
        const prodTemplate = Template.fromStack(prodStack);

        // 本番環境ではポイントインタイムリカバリが有効
        prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true,
            },
        });
    });

    test('開発環境ではポイントインタイムリカバリが無効になる', () => {
        // 開発環境ではポイントインタイムリカバリが無効（設定されない）
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: false,
            },
        });
    });

    test('CloudFormation出力が設定される', () => {
        // CloudFormation出力が設定されることを確認
        template.hasOutput('MainTableName', {
            Description: 'DynamoDB Main Table Name',
        });

        template.hasOutput('MainTableArn', {
            Description: 'DynamoDB Main Table ARN',
        });

        template.hasOutput('GSI1IndexName', {
            Description: 'GSI1 Index Name for Match by User Date',
        });

        template.hasOutput('GSI2IndexName', {
            Description: 'GSI2 Index Name for Match by User Mode Date',
        });
    });

    test('mainTableプロパティが正しく設定される', () => {
        // mainTableプロパティがDynamoDBテーブルインスタンスであることを確認
        expect(stack.mainTable).toBeDefined();
        // CDKトークンのため、実際のテーブル名の検証はCloudFormationテンプレートで行う
        expect(stack.mainTable.tableName).toBeDefined();
    });

    test('スタックが正しいプロパティで作成される', () => {
        // スタックが正しい環境設定で作成されることを確認
        expect(stack.stackName).toBe('TestDynamoDBStack');
        expect(stack.region).toBe('ap-northeast-1');
    });

    test('local環境でも正しく動作する', () => {
        // local環境用のスタックを作成
        const localApp = new cdk.App();
        const localStack = new DynamoDBStack(localApp, 'LocalDynamoDBStack', {
            ...defaultStackProps,
            environment: 'local',
        });
        const localTemplate = Template.fromStack(localStack);

        // local環境でもテーブルが作成される
        localTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
        localTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
            TableName: 'janlog-table-local',
        });
    });

    test('development環境でも正しく動作する', () => {
        // development環境用のスタックを作成
        const devApp = new cdk.App();
        const devStack = new DynamoDBStack(devApp, 'DevDynamoDBStack', {
            ...defaultStackProps,
            environment: 'development',
        });
        const devTemplate = Template.fromStack(devStack);

        // development環境でもテーブルが作成される
        devTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
        devTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
            TableName: 'janlog-table-development',
        });
    });
});