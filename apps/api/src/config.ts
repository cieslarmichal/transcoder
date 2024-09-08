import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '@common/errors';
import { LogLevel } from '@common/logger';

import { AwsRegion } from './common/types/awsRegion.js';

const configSchema = Type.Object({
  appName: Type.String({ minLength: 1 }),
  server: Type.Object({
    host: Type.String({ minLength: 1 }),
    port: Type.Number({
      minimum: 1,
      maximum: 65535,
    }),
  }),
  logLevel: Type.Enum(LogLevel),
  aws: Type.Object({
    accessKeyId: Type.String({ minLength: 1 }),
    secretAccessKey: Type.String({ minLength: 1 }),
    region: Type.Enum(AwsRegion),
    endpoint: Type.Optional(Type.String({ minLength: 1 })),
    bucketName: Type.String({ minLength: 1 }),
  }),
  amqp: Type.Object({
    url: Type.String({ minLength: 1 }),
  }),
});

export type Config = Static<typeof configSchema>;

export class ConfigFactory {
  public static create(): Config {
    try {
      return Value.Decode(configSchema, config);
    } catch (error) {
      if (error instanceof TransformDecodeCheckError) {
        throw new ConfigurationError({ ...error.error });
      }

      throw error;
    }
  }
}
