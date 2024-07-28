import { BaseError } from './baseError.js';

interface Context {
  readonly [key: string]: unknown;
}

export class ConfigurationError extends BaseError<Context> {
  public constructor(context: Context) {
    super('ConfigurationError', 'Configuration not valid.', context);
  }
}
