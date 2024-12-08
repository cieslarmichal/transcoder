import { BaseError } from './baseError.js';

export const createFinalErrorHandler = (teardownCallback?: () => Promise<void>) => {
  return async (error: unknown): Promise<void> => {
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

    if (teardownCallback) {
      await teardownCallback();
    }

    process.exit(1);
  };
};
