import { type HttpController } from '../../../common/types/httpController.js';
import { HttpMethodName } from '../../../common/types/httpMethodName.js';
import { type HttpOkResponse } from '../../../common/types/httpResponse.js';
import { HttpRoute } from '../../../common/types/httpRoute.js';
import { HttpStatusCode } from '../../../common/types/httpStatusCode.js';
import { checkHealthResponseBodySchema, type CheckHealthResponseBody } from './schemas/checkHealthSchema.js';

export class ApplicationHttpController implements HttpController {
  public readonly basePath = '/health';
  public readonly tags = ['Health'];

  public getHttpRoutes(): HttpRoute[] {
    return [
      new HttpRoute({
        method: HttpMethodName.get,
        handler: this.checkHealth.bind(this),
        schema: {
          request: {},
          response: {
            [HttpStatusCode.ok]: {
              schema: checkHealthResponseBodySchema,
              description: 'Application is healthy',
            },
          },
        },
        description: 'Check application health',
      }),
    ];
  }

  private async checkHealth(): Promise<HttpOkResponse<CheckHealthResponseBody>> {
    return {
      statusCode: HttpStatusCode.ok,
      body: {
        healthy: true,
      },
    };
  }
}
