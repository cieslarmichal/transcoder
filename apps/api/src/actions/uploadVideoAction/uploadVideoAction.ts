import { type Readable } from 'node:stream';

import { type Logger } from '@common/logger';
import { type S3Service } from '@common/s3';

import { type UuidService } from '../../common/uuid/uuidService.js';
import { exchangeName, routingKeys, type VideoIngestedMessage } from '@common/contracts';
import { OperationNotValidError } from '@common/errors';
import { type RedisClient } from '@common/redis';
import { type AmqpChannel } from '@common/amqp';
import { type Config } from '../../config.js';
import {
  isVideoContainer,
  mapVideoContainerToContentType,
} from '../../../../../common/contracts/src/amqp/messages/encodingContainer.js';

export interface UploadVideoActionPayload {
  readonly fileName: string;
  readonly data: Readable;
  readonly userEmail: string;
}

export interface UploadVideoActionResult {
  readonly videoId: string;
  readonly videoUrl: string;
}

export class UploadVideoAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly s3Service: S3Service,
    private readonly redisClient: RedisClient,
    private readonly uuidService: UuidService,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: UploadVideoActionPayload): Promise<UploadVideoActionResult> {
    const { fileName, data, userEmail } = payload;

    const bucketName = this.config.aws.s3.ingestedVideosBucket;

    this.logger.debug({
      message: 'Uploading video...',
      bucketName,
      fileName,
      userEmail,
    });

    const fileExtension = fileName.split('.').pop();

    if (!fileExtension) {
      throw new OperationNotValidError({
        reason: 'File has no extension.',
        fileName,
      });
    }

    if (!isVideoContainer(fileExtension)) {
      throw new OperationNotValidError({
        reason: 'File is not a video.',
        fileName,
      });
    }

    const videoContentType = mapVideoContainerToContentType(fileExtension);

    if (!videoContentType) {
      throw new OperationNotValidError({
        reason: 'File is not a video.',
        fileName,
      });
    }

    const videoId = this.uuidService.generateUuid();

    const blobName = `${videoId}/source`;

    const { location: videoUrl } = await this.s3Service.uploadBlob({
      bucketName,
      blobName,
      sourceName: fileName,
      data,
      contentType: videoContentType,
    });

    this.logger.debug({
      message: 'Video uploaded.',
      blobName,
      videoUrl,
    });

    const redisKey = `${videoId}-notification-email`;

    await this.redisClient.set(redisKey, userEmail);

    const message = {
      videoId,
      videoUrl,
      videoContainer: fileExtension,
    } satisfies VideoIngestedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoIngested, Buffer.from(JSON.stringify(message)));

    return {
      videoId,
      videoUrl,
    };
  }
}
