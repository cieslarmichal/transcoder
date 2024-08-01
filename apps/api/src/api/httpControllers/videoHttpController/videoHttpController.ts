import { OperationNotValidError } from '@common/errors';

import {
  type UploadVideoQueryParamsDto,
  type UploadVideoResponseBodyDto,
  uploadVideoQueryParamsDtoSchema,
  uploadVideoResponseBodyDtoSchema,
} from './schemas/uploadVideoSchema.js';
import { type UploadVideoAction } from '../../../actions/uploadVideoAction/uploadVideoAction.js';
import { type HttpController } from '../../../common/types/http/httpController.js';
import { HttpMethodName } from '../../../common/types/http/httpMethodName.js';
import { type HttpRequest } from '../../../common/types/http/httpRequest.js';
import { type HttpCreatedResponse } from '../../../common/types/http/httpResponse.js';
import { HttpRoute } from '../../../common/types/http/httpRoute.js';
import { HttpStatusCode } from '../../../common/types/http/httpStatusCode.js';

export class VideoHttpController implements HttpController {
  public readonly basePath = '/videos';
  public readonly tags = ['Video'];

  public constructor(private readonly uploadFileAction: UploadVideoAction) {}

  public getHttpRoutes(): HttpRoute[] {
    return [
      new HttpRoute({
        method: HttpMethodName.post,
        handler: this.uploadVideo.bind(this),
        schema: {
          request: {
            queryParams: uploadVideoQueryParamsDtoSchema,
          },
          response: {
            [HttpStatusCode.created]: {
              schema: uploadVideoResponseBodyDtoSchema,
              description: 'Video uploaded',
            },
          },
        },
        description: 'Upload video',
      }),
    ];
  }

  private async uploadVideo(
    request: HttpRequest<undefined, UploadVideoQueryParamsDto>,
  ): Promise<HttpCreatedResponse<UploadVideoResponseBodyDto>> {
    const { notificationEmail } = request.queryParams;

    if (!request.file) {
      throw new OperationNotValidError({
        reason: 'No file attached',
      });
    }

    const { traceId } = await this.uploadFileAction.execute({
      notificationEmail,
      data: request.file.data,
      contentType: request.file.type,
    });

    return {
      statusCode: HttpStatusCode.created,
      body: { traceId },
    };
  }
}
