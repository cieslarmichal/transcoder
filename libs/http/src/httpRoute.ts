/* eslint-disable @typescript-eslint/no-explicit-any */

import { type TSchema } from '@sinclair/typebox';

import { type HttpMethodName } from './httpMethodName.js';
import { type HttpRouteHandler } from './httpRouteHandler.js';

export interface HttpRouteSchema {
  readonly request: {
    body?: TSchema;
    queryParams?: TSchema;
    pathParams?: TSchema;
  };
  readonly response: Record<number, { schema: TSchema; description: string }>;
}

export interface HttpRouteDraft {
  readonly method: HttpMethodName;
  readonly path?: string;
  readonly handler: HttpRouteHandler;
  readonly schema: HttpRouteSchema;
  readonly description: string;
  readonly preValidation?: (request: any) => void;
}

export class HttpRoute {
  public readonly method: HttpMethodName;
  public readonly path: string;
  public readonly handler: HttpRouteHandler;
  public readonly schema: HttpRouteSchema;
  public readonly description: string;
  public readonly preValidation?: (request: any) => void;

  public constructor(draft: HttpRouteDraft) {
    const { method, path, handler, schema, description, preValidation } = draft;

    this.method = method;

    this.path = path ?? '';

    this.handler = handler;

    this.schema = schema;

    this.description = description;

    if (preValidation) {
      this.preValidation = preValidation;
    }
  }
}
