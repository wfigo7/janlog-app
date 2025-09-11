import * as cdk from 'aws-cdk-lib';

export interface JanlogStackProps extends cdk.StackProps {
  env: cdk.Environment;
  environment: string;
  project?: string;
  developer?: string;
  ManagedBy?: string;
}

export const defaultStackProps: JanlogStackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
  environment: 'development',
  project: 'Janlog',
  developer: 'wfigo',
  ManagedBy: 'CDK',
};