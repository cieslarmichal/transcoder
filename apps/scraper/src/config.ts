import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '@common/errors';
import { LogLevel } from '@common/logger';

const configSchema = Type.Object({
  logLevel: Type.Enum(LogLevel),
  databasePath: Type.String({ minLength: 1 }),
  openLibraryPath: Type.String({ minLength: 1 }),
  misyma: Type.Object({
    url: Type.String({ minLength: 1 }),
    apiKey: Type.String({ minLength: 1 }),
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
