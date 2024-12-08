import { S3, type S3ClientConfig } from '@aws-sdk/client-s3';

import { type AwsRegion } from './awsRegion.js';
import { type S3Client } from './s3Client.js';

export interface S3Config {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly region: AwsRegion;
  readonly endpoint?: string | undefined;
}

export class S3ClientFactory {
  public static create(config: S3Config): S3Client {
    const { accessKeyId, secretAccessKey, region, endpoint } = config;

    let s3SdkConfig: S3ClientConfig = {
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    if (endpoint) {
      s3SdkConfig = {
        ...s3SdkConfig,
        endpoint,
      };
    }

    return new S3(s3SdkConfig);
  }
}
