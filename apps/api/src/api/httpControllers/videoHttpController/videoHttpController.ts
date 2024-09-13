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
import { type HttpOkResponse, type HttpCreatedResponse } from '../../../common/types/http/httpResponse.js';
import { HttpRoute } from '../../../common/types/http/httpRoute.js';
import { HttpStatusCode } from '../../../common/types/http/httpStatusCode.js';
import {
  type GetVideoEncodingProgressPathParamsDto,
  getVideoEncodingProgressPathParamsDtoSchema,
  type GetVideoEncodingProgressResponseBodyDto,
  getVideoEncodingProgressResponseBodyDtoSchema,
} from './schemas/getVideoEncodingProgressSchema.js';
import { type GetVideoEncodingProgressAction } from '../../../actions/getVideoEncodingProgressAction/getVideoEncodingProgressAction.js';
import { type GetVideoEncodingArtifactsAction } from '../../../actions/getVideoEncodingArtifactsAction/getVideoEncodingArtifactsAction.js';
import {
  getVideoEncodingArtifactsPathParamsDtoSchema,
  getVideoEncodingArtifactsResponseBodyDtoSchema,
  type GetVideoEncodingArtifactsPathParamsDto,
  type GetVideoEncodingArtifactsResponseBodyDto,
} from './schemas/getVideoEncodingArtifactsSchema.js';

export class VideoHttpController implements HttpController {
  public readonly basePath = '/videos';
  public readonly tags = ['Video'];

  public constructor(
    private readonly uploadFileAction: UploadVideoAction,
    private readonly getVideoEncodingProgressAction: GetVideoEncodingProgressAction,
    private readonly getVideoEncodingArtifactsAction: GetVideoEncodingArtifactsAction,
  ) {}

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
      new HttpRoute({
        method: HttpMethodName.get,
        path: '/:videoId/progress',
        handler: this.getVideoEncodingProgress.bind(this),
        schema: {
          request: {
            pathParams: getVideoEncodingProgressPathParamsDtoSchema,
          },
          response: {
            [HttpStatusCode.ok]: {
              schema: getVideoEncodingProgressResponseBodyDtoSchema,
              description: 'Video encoding progress fetched',
            },
          },
        },
        description: 'Fetch video encoding progress',
      }),
      new HttpRoute({
        method: HttpMethodName.get,
        path: '/:videoId/artifacts',
        handler: this.getVideoEncodingArtifacts.bind(this),
        schema: {
          request: {
            pathParams: getVideoEncodingArtifactsPathParamsDtoSchema,
          },
          response: {
            [HttpStatusCode.ok]: {
              schema: getVideoEncodingArtifactsResponseBodyDtoSchema,
              description: 'Video encoding artifacts fetched',
            },
          },
        },
        description: 'Fetch video encoding artifacts',
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

    const { id, url } = await this.uploadFileAction.execute({
      userEmail: notificationEmail,
      data: request.file.data,
      contentType: request.file.type,
    });

    return {
      statusCode: HttpStatusCode.created,
      body: {
        id,
        url,
      },
    };
  }

  private async getVideoEncodingProgress(
    request: HttpRequest<undefined, undefined, GetVideoEncodingProgressPathParamsDto>,
  ): Promise<HttpOkResponse<GetVideoEncodingProgressResponseBodyDto>> {
    const { videoId } = request.pathParams;

    const { encodingProgress } = await this.getVideoEncodingProgressAction.execute({ videoId });

    return {
      statusCode: HttpStatusCode.ok,
      body: { data: encodingProgress },
    };
  }

  private async getVideoEncodingArtifacts(
    request: HttpRequest<undefined, undefined, GetVideoEncodingArtifactsPathParamsDto>,
  ): Promise<HttpOkResponse<GetVideoEncodingArtifactsResponseBodyDto>> {
    const { videoId } = request.pathParams;

    const { encodingArtifacts } = await this.getVideoEncodingArtifactsAction.execute({ videoId });

    return {
      statusCode: HttpStatusCode.ok,
      body: { data: encodingArtifacts },
    };
  }
}
