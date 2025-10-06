import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { JanlogStackProps } from '../common/stack-props';

export interface ECRStackProps extends JanlogStackProps {}

export class ECRStack extends cdk.Stack {
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: ECRStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // ECRリポジトリの作成
    this.ecrRepository = new ecr.Repository(this, 'JanlogApiRepository', {
      repositoryName: `janlog-api-${environment}`,
      removalPolicy: environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep only latest 10 images',
          maxImageCount: 10,
        },
      ],
    });

    // 出力
    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `JanlogECRRepositoryUri-${environment}`,
    });

    new cdk.CfnOutput(this, 'ECRRepositoryName', {
      value: this.ecrRepository.repositoryName,
      description: 'ECR Repository Name',
      exportName: `JanlogECRRepositoryName-${environment}`,
    });

    // タグ設定
    cdk.Tags.of(this.ecrRepository).add('Component', 'Container Registry');
  }
}