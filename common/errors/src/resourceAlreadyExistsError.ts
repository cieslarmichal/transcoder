import { BaseError } from './baseError.js';

interface Context {
  readonly resource: string;
  readonly [key: string]: unknown;
}

export class ResourceAlreadyExistsError extends BaseError<Context> {
  public constructor(context: Context) {
    super('ResourceAlreadyExistsError', 'Resource already exists.', context);
  }
}
