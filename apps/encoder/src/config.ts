import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '@libs/errors';
import { LogLevel } from '@libs/logger';

const configSchema = Type.Object({
  appName: Type.String({ minLength: 1 }),
  logLevel: Type.Enum(LogLevel),
  sharedDirectory: Type.String({ minLength: 1 }),
  amqp: Type.Object({
    url: Type.String({ minLength: 1 }),
    redeliveryDropThreshold: Type.Number({ minimum: 1 }),
    messageTtl: Type.Number({ minimum: 1 }),
  }),
  redis: Type.Object({
    host: Type.String({ minLength: 1 }),
    port: Type.Number({
      minimum: 1,
      maximum: 65535,
    }),
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
