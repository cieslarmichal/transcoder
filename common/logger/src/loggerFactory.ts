import { pino } from 'pino';

import { Logger } from './logger.js';
import { type LogLevel } from './logLevel.js';

interface LoggerConfig {
  readonly appName: string;
  readonly logLevel: LogLevel;
}

export class LoggerFactory {
  public static create(config: LoggerConfig): Logger {
    const { req, res, err } = pino.stdSerializers;

    const logger = pino({
      name: config.appName,
      level: config.logLevel,
      serializers: {
        req,
        res,
        err,
      },
    });

    return new Logger(logger);
  }
}
