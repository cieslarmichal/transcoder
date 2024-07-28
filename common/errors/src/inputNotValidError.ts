import { BaseError } from './baseError.js';

interface Context {
  readonly reason: string;
  readonly value: unknown;
  readonly [key: string]: unknown;
}

export class InputNotValidError extends BaseError<Context> {
  public constructor(context: Context) {
    super('InputNotValidError', 'Input not valid.', context);
  }
}
