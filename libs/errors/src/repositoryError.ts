import { BaseError } from './baseError.js';

interface Context {
  readonly entity: string;
  readonly operation: string;
  readonly [key: string]: unknown;
}

export class RepositoryError extends BaseError<Context> {
  public constructor(context: Context) {
    super('RepositoryError', 'Repository error.', context);
  }
}
