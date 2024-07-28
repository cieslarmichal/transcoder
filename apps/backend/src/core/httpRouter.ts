/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type FastifyInstance, type FastifyReply, type FastifyRequest, type FastifySchema } from 'fastify';

import { type HttpController } from '../common/types/http/httpController.js';
import { HttpHeader } from '../common/types/http/httpHeader.js';
import { HttpMediaType } from '../common/types/http/httpMediaType.js';
import { type AttachedFile } from '../common/types/http/httpRequest.js';
import { type HttpRouteSchema, type HttpRoute } from '../common/types/http/httpRoute.js';

export interface RegisterControllersPayload {
  readonly controllers: HttpController[];
}

export interface RegisterRoutesPayload {
  readonly routes: HttpRoute[];
  readonly basePath: string;
  readonly tags: string[];
}

export interface NormalizePathPayload {
  readonly path: string;
}

export class HttpRouter {
  private readonly rootPath = '/api';

  public constructor(private readonly fastifyServer: FastifyInstance) {}

  public registerControllers(payload: RegisterControllersPayload): void {
    const { controllers } = payload;

    controllers.forEach((controller) => {
      const { basePath, tags } = controller;

      const routes = controller.getHttpRoutes();

      this.registerControllerRoutes({
        routes,
        basePath,
        tags,
      });
    });
  }

  private registerControllerRoutes(payload: RegisterRoutesPayload): void {
    const { routes, basePath, tags } = payload;

    routes.map((httpRoute) => {
      const { method, path: controllerPath, description, preValidation: preValidationHook, securityMode } = httpRoute;

      const path = this.normalizePath({ path: `/${this.rootPath}/${basePath}/${controllerPath}` });

      const handler = async (fastifyRequest: FastifyRequest, fastifyReply: FastifyReply): Promise<void> => {
        let attachedFile: AttachedFile | undefined;

        if (fastifyRequest.isMultipart()) {
          const file = await fastifyRequest.file();

          if (file) {
            attachedFile = {
              name: file.filename,
              type: file.mimetype,
              data: file.file,
            };
          }
        }

        const { statusCode, body: responseBody } = await httpRoute.handler({
          body: fastifyRequest.body,
          pathParams: fastifyRequest.params,
          queryParams: fastifyRequest.query,
          headers: fastifyRequest.headers as Record<string, string>,
          file: attachedFile,
        });

        fastifyReply.status(statusCode);

        if (responseBody) {
          fastifyReply.header(HttpHeader.contentType, HttpMediaType.applicationJson).send(responseBody);
        } else {
          fastifyReply.send();
        }

        return fastifyReply;
      };

      this.fastifyServer.route({
        method,
        url: path,
        handler,
        schema: {
          description,
          tags,
          ...this.mapToFastifySchema(httpRoute.schema),
          ...(securityMode ? { security: [{ [securityMode]: [] }] } : {}),
        },
        ...(preValidationHook
          ? {
              preValidation: (request, _reply, next): void => {
                preValidationHook(request);

                next();
              },
            }
          : undefined),
      });
    });
  }

  private mapToFastifySchema(routeSchema: HttpRouteSchema): FastifySchema {
    const { pathParams, queryParams, body } = routeSchema.request;

    const fastifySchema: FastifySchema = {};

    if (pathParams) {
      fastifySchema.params = pathParams;
    }

    if (queryParams) {
      fastifySchema.querystring = queryParams;
    }

    if (body) {
      fastifySchema.body = body;
    }

    fastifySchema.response = Object.entries(routeSchema.response).reduce((agg, [statusCode, statusCodeSchema]) => {
      const { schema, description } = statusCodeSchema;

      return {
        ...agg,
        [statusCode]: {
          ...schema,
          description,
        },
      };
    }, {});

    return fastifySchema;
  }

  private normalizePath(payload: NormalizePathPayload): string {
    const { path } = payload;

    const urlWithoutDoubleSlashes = path.replace(/(\/+)/g, '/');

    const urlWithoutTrailingSlash = urlWithoutDoubleSlashes.replace(/(\/)$/g, '');

    return urlWithoutTrailingSlash;
  }
}
