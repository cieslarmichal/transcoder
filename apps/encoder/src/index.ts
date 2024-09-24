import { createFinalErrorHandler } from '@libs/errors';
import { Application } from './application.js';

const teardownCallback = async (): Promise<void> => {
  await application?.stop();
};

const finalErrorHandler = createFinalErrorHandler(teardownCallback);

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
