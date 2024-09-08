import { BaseError } from '@common/errors';
import { Application } from './application.js';

const finalErrorHandler = async (error: unknown): Promise<void> => {
  let formattedError = error;

  if (error instanceof Error) {
    formattedError = {
      name: error.name,
      message: error.message,
      ...(error instanceof BaseError ? { ...error.context } : undefined),
    };
  }

  console.error(
    JSON.stringify({
      message: 'Application error.',
      context: formattedError,
    }),
  );

  await application?.stop();

  process.exitCode = 1;
};

process.on('unhandledRejection', finalErrorHandler);

process.on('uncaughtException', finalErrorHandler);

process.on('SIGINT', finalErrorHandler);

process.on('SIGTERM', finalErrorHandler);

let application: Application | undefined;

try {
  application = new Application();

  await application.start();
} catch (error) {
  await finalErrorHandler(error);
}
