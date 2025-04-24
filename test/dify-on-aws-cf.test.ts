import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DifyOnAwsStack } from '../lib/dify-on-aws-stack';
import { ApNortheast1Stack } from '../lib/ap-northeast-1-stack';
import { EnvironmentProps } from '../lib/environment-props';

test('Snapshot test (with CloudFront)', () => {
  // GIVEN
  const app = new cdk.App();

  const props: EnvironmentProps = {
    awsRegion: 'ap-northeast-1',
    awsAccount: '123456789012',
    allowedIPv4Cidrs: ['0.0.0.0/0'],
    allowedIPv6Cidrs: ['::/0'],
    difySandboxImageTag: '0.2.4',
    domainName: 'example.com',
    allowAnySyscalls: true,
    setupEmail: true,
  };

  // WHEN
  let virginia: ApNortheast1Stack | undefined = undefined;
  if ((props.useCloudFront ?? true) && (props.domainName || props.allowedIPv4Cidrs || props.allowedIPv6Cidrs)) {
    virginia = new ApNortheast1Stack(app, 'TestApNortheast1Stack', {
      env: { region: 'us-east-1', account: props.awsAccount },
      crossRegionReferences: true,
      domainName: props.domainName,
      allowedIpV4AddressRanges: props.allowedIPv4Cidrs,
      allowedIpV6AddressRanges: props.allowedIPv6Cidrs,
    });
  }

  const main = new DifyOnAwsStack(app, 'TestStack', {
    env: { region: props.awsRegion, account: props.awsAccount },
    crossRegionReferences: true,
    ...props,
    cloudFrontCertificate: virginia?.certificate,
    cloudFrontWebAclArn: virginia?.webAclArn,
  });

  //THEN
  expect(virginia).toBeDefined();
  expect(Template.fromStack(virginia!)).toMatchSnapshot();
  expect(Template.fromStack(main)).toMatchSnapshot();
});
