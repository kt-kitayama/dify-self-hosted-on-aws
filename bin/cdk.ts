#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DifyOnAwsStack } from '../lib/dify-on-aws-stack';
import { ApNortheast1Stack } from '../lib/ap-northeast-1-stack';
import { EnvironmentProps } from '../lib/environment-props';

export const props: EnvironmentProps = {
  awsRegion: 'ap-northeast-1',
  awsAccount: process.env.CDK_DEFAULT_ACCOUNT!,
  // Difyのバージョンを指定
  difyImageTag: '1.3.0',
  // plugin-daemonのバージョンを安定版に設定
  difyPluginDaemonImageTag: '0.0.6-local',

  // 以下のオプションをコメントアウト解除すると、より安価な構成になります:
  isRedisMultiAz: false,
  useNatInstance: true,
  enableAuroraScalesToZero: true,
  useFargateSpot: true,

  // 利用可能な全プロパティは lib/environment-props.ts の EnvironmentProps を参照してください
};

const app = new cdk.App();

let virginia: ApNortheast1Stack | undefined = undefined;
if ((props.useCloudFront ?? true) && (props.domainName || props.allowedIPv4Cidrs || props.allowedIPv6Cidrs)) {
  // 同一アカウント内で異なるDifyインスタンスの衝突を防ぐため、一意なサフィックスを付与
  virginia = new ApNortheast1Stack(app, `DifyOnAwsApNortheast1Stack${props.subDomain ? `-${props.subDomain}` : ''}`, {
    env: { region: 'us-east-1', account: props.awsAccount },
    crossRegionReferences: true,
    domainName: props.domainName,
    allowedIpV4AddressRanges: props.allowedIPv4Cidrs,
    allowedIpV6AddressRanges: props.allowedIPv6Cidrs,
  });
}

new DifyOnAwsStack(app, 'DifyOnAwsStack', {
  env: { region: props.awsRegion, account: props.awsAccount },
  crossRegionReferences: true,
  ...props,
  cloudFrontCertificate: virginia?.certificate,
  cloudFrontWebAclArn: virginia?.webAclArn,
});
