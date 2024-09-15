import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '@common/errors';
import { LogLevel } from '@common/logger';
import { EncodingId } from '@common/contracts';
import { EncodingContainer } from '../../../common/contracts/src/amqp/messages/encodingContainer.js';

const configSchema = Type.Object({
  appName: Type.String({ minLength: 1 }),
  logLevel: Type.Enum(LogLevel),
  amqp: Type.Object({
    url: Type.String({ minLength: 1 }),
    redeliveryDropThreshold: Type.Number({ minimum: 1 }),
    messageTtl: Type.Number({ minimum: 1 }),
  }),
  encoding: Type.Object({
    profiles: Type.Array(
      Type.Object({
        id: Type.Enum(EncodingId),
        container: Type.Enum(EncodingContainer),
        width: Type.Integer(),
        height: Type.Integer(),
        bitrate: Type.Integer(),
        fps: Type.Integer(),
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
