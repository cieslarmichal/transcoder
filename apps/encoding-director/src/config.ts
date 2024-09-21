import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '@libs/errors';
import { LogLevel } from '@libs/logger';
import { EncodingId, EncodingContainer } from '@libs/contracts';

const configSchema = Type.Object({
  appName: Type.String({ minLength: 1 }),
  logLevel: Type.Enum(LogLevel),
  amqp: Type.Object({
    url: Type.String({ minLength: 1 }),
    redeliveryDropThreshold: Type.Number({ minimum: 1 }),
    messageTtl: Type.Number({ minimum: 1 }),
  }),
  encoding: Type.Object({
    artifacts: Type.Array(
      Type.Object({
        id: Type.Enum(EncodingId),
        container: Type.Enum(EncodingContainer),
        width: Type.Integer({ minimum: 1 }),
        height: Type.Integer({ minimum: 1 }),
        bitrate: Type.Optional(Type.Integer({ minimum: 1 })),
        fps: Type.Optional(Type.Integer({ minimum: 1 })),
      }),
    ),
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
