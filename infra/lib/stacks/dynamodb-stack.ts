import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export class DynamoDBStack extends cdk.Stack {
    public readonly mainTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: JanlogStackProps) {
        super(scope, id, props);

        const { environment } = props;

        // メインテーブル（シングルテーブル設計）
        this.mainTable = new dynamodb.Table(this, 'JanlogMainTable', {
            tableName: `janlog-table-${environment}`,

            // パーティションキーとソートキー
            partitionKey: {
                name: 'PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: dynamodb.AttributeType.STRING,
            },

            // オンデマンド課金設定
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

            // 削除保護設定（production環境のみ）
            removalPolicy: environment === 'production'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,

            // ポイントインタイムリカバリ（本番環境では有効化）
            pointInTimeRecovery: environment === 'production',

            // 暗号化設定
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // タグ設定
        cdk.Tags.of(this.mainTable).add('Component', 'Database');

        // GSI1: MATCH_BY_USER_DATE（期間指定での対局取得用）
        this.mainTable.addGlobalSecondaryIndex({
            indexName: 'GSI1-MATCH_BY_USER_DATE',
            partitionKey: {
                name: 'GSI1PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'GSI1SK',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI2: MATCH_BY_USER_MODE_DATE（3人麻雀・4人麻雀の高速フィルタリング用）
        this.mainTable.addGlobalSecondaryIndex({
            indexName: 'GSI2-MATCH_BY_USER_MODE_DATE',
            partitionKey: {
                name: 'GSI2PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'GSI2SK',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // 出力
        new cdk.CfnOutput(this, 'MainTableName', {
            value: this.mainTable.tableName,
            description: 'DynamoDB Main Table Name',
            exportName: `JanlogMainTableName-${environment}`,
        });

        new cdk.CfnOutput(this, 'MainTableArn', {
            value: this.mainTable.tableArn,
            description: 'DynamoDB Main Table ARN',
            exportName: `JanlogMainTableArn-${environment}`,
        });

        new cdk.CfnOutput(this, 'GSI1IndexName', {
            value: 'GSI1-MATCH_BY_USER_DATE',
            description: 'GSI1 Index Name for Match by User Date',
            exportName: `JanlogGSI1IndexName-${environment}`,
        });

        new cdk.CfnOutput(this, 'GSI2IndexName', {
            value: 'GSI2-MATCH_BY_USER_MODE_DATE',
            description: 'GSI2 Index Name for Match by User Mode Date',
            exportName: `JanlogGSI2IndexName-${environment}`,
        });
    }
}