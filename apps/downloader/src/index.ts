/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseError } from '@common/errors';
import { LoggerFactory } from '@common/logger';

import { ConfigFactory } from './config.js';

const finalErrorHandler = async (error: unknown): Promise<void> => {
  let errorContext;

  if (error instanceof Error) {
    errorContext = {
      name: error.name,
      message: error.message,
      ...(error instanceof BaseError ? { ...error.context } : undefined),
    };
  } else {
    errorContext = error;
  }

  console.error(
    JSON.stringify({
      message: 'Application error.',
      context: errorContext,
    }),
  );

  process.exit(1);
};

process.on('unhandledRejection', finalErrorHandler);

process.on('uncaughtException', finalErrorHandler);

process.on('SIGINT', finalErrorHandler);

process.on('SIGTERM', finalErrorHandler);

try {
  const config = ConfigFactory.create();

  const logger = LoggerFactory.create({
    appName: config.appName,
    logLevel: config.logLevel,
  });

  logger.info({
    message: 'Application started.',
  });
} catch (error) {
  await finalErrorHandler(error);
}
