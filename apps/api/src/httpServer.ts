/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { fastifyCors } from '@fastify/cors';
import { fastifyHelmet } from '@fastify/helmet';
import { fastifyMultipart } from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fastify, type FastifyInstance } from 'fastify';
import { type FastifySchemaValidationError } from 'fastify/types/schema.js';

import { BaseError, InputNotValidError, OperationNotValidError, ResourceNotFoundError } from '@libs/errors';
import { type Logger } from '@libs/logger';

import { type Config } from './config.js';
import { HttpRouter } from './httpRouter.js';
import { HttpStatusCode, type HttpController } from '@libs/http';

export class HttpServer {
  private readonly fastifyServer: FastifyInstance;
  private readonly httpRouter: HttpRouter;

  public constructor(
    private readonly httpControllers: HttpController[],
    private readonly loggerService: Logger,
    private readonly config: Config,
  ) {
    this.fastifyServer = fastify({ bodyLimit: 10 * 1024 * 1024 }).withTypeProvider<TypeBoxTypeProvider>();

    this.httpRouter = new HttpRouter(this.fastifyServer);
  }

  public async start(): Promise<void> {
    const { host, port } = this.config.server;

    this.setupErrorHandler();

    await this.initSwagger();

    await this.fastifyServer.register(fastifyMultipart, {
      limits: {
        fileSize: 1024 * 1024 * 1024 * 4,
      },
    });

    await this.fastifyServer.register(fastifyHelmet);

    await this.fastifyServer.register(fastifyCors, {
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
    });

    this.fastifyServer.addHook('onRequest', (request, _reply, done) => {
      this.loggerService.info({
        message: 'HTTP request received.',
        endpoint: `${request.method} ${request.url}`,
      });

      done();
    });

    this.fastifyServer.addHook('onSend', (request, reply, _payload, done) => {
      this.loggerService.info({
        message: 'HTTP response sent.',
        endpoint: `${request.method} ${request.url}`,
        statusCode: reply.statusCode,
      });

      done();
    });

    this.fastifyServer.setSerializerCompiler(() => {
      return (data): string => JSON.stringify(data);
    });

    this.addRequestPreprocessing();

    this.httpRouter.registerControllers({ controllers: this.httpControllers });

    await this.fastifyServer.listen({
      port,
      host,
    });

    this.loggerService.info({
      message: 'HTTP Server started.',
      port,
      host,
    });
  }

  public async stop(): Promise<void> {
    await this.fastifyServer.close();

    this.loggerService.info({ message: 'HTTP Server stopped.' });
  }

  private setupErrorHandler(): void {
    this.fastifyServer.setSchemaErrorFormatter((errors, dataVar) => {
      const { instancePath, message } = errors[0] as FastifySchemaValidationError;

      return new InputNotValidError({
        reason: `${dataVar}${instancePath} ${message}`,
        value: undefined,
      });
    });

    this.fastifyServer.setErrorHandler((error, request, reply) => {
      const errorContext = {
        ...(error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              cause: error.cause,
              context: error instanceof BaseError ? error.context : undefined,
            }
          : { error }),
      };

      this.loggerService.error({
        message: 'Caught an error in the HTTP server.',
        endpoint: `${request.method} ${request.url}`,
        error: errorContext,
      });

      const responseError = {
        ...errorContext,
        stack: undefined,
        cause: undefined,
      };

      if (error instanceof InputNotValidError) {
        return reply.status(HttpStatusCode.badRequest).send(responseError);
      }

      if (error instanceof ResourceNotFoundError) {
        return reply.status(HttpStatusCode.notFound).send(responseError);
      }

      if (error instanceof OperationNotValidError) {
        return reply.status(HttpStatusCode.badRequest).send(responseError);
      }

      return reply.status(HttpStatusCode.internalServerError).send({
        name: 'InternalServerError',
        message: 'Internal server error',
      });
    });
  }

  private async initSwagger(): Promise<void> {
    await this.fastifyServer.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Transcoder API',
          version: '1.0.0',
        },
      },
    });

    await this.fastifyServer.register(fastifySwaggerUi, {
      routePrefix: '/api/v1/docs',
      uiConfig: {
        defaultModelRendering: 'model',
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
      },
      staticCSP: true,
    });
  }

  private addRequestPreprocessing(): void {
    this.fastifyServer.addHook('preValidation', (request, _reply, next) => {
      const body = request.body as Record<string, unknown>;

      this.trimStringProperties(body);

      next();
    });
  }

  private trimStringProperties(obj: Record<string, any>): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.trimStringProperties(obj[key]);
      }
    }
  }
}
