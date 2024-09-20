export class BaseError<Context> extends Error {
  public readonly context: Context;

  public constructor(name: string, message: string, context: Context) {
    super(message);

    this.name = name;

    this.context = context;
  }
}
