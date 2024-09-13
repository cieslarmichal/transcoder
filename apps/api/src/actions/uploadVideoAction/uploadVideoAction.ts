import { type Readable } from 'node:stream';

import { type Logger } from '@common/logger';
import { type S3Service } from '@common/s3';

import { type UuidService } from '../../common/uuid/uuidService.js';
import { bucketNames, exchangeName, routingKeys, type VideoIngestedMessage } from '@common/contracts';
import { type Channel } from 'amqplib';

export interface UploadVideoActionPayload {
  readonly data: Readable;
  readonly contentType: string;
  readonly userEmail: string;
}

export interface UploadVideoActionResult {
  readonly id: string;
  readonly url: string;
}

export class UploadVideoAction {
  public constructor(
    private readonly channel: Channel,
    private readonly s3Service: S3Service,
    private readonly uuidService: UuidService,
    private readonly logger: Logger,
  ) {}

  public async execute(payload: UploadVideoActionPayload): Promise<UploadVideoActionResult> {
    const { contentType, data, userEmail } = payload;

    this.logger.debug({
      message: 'Uploading video...',
      bucketName: bucketNames.ingestedVideos,
      contentType,
      userEmail,
    });

    const videoId = this.uuidService.generateUuid();

    const { location: videoUrl } = await this.s3Service.uploadBlob({
      bucketName: bucketNames.ingestedVideos,
      blobName: videoId,
      data,
      contentType,
    });

    this.logger.debug({
      message: 'Video uploaded.',
      videoUrl,
    });

    const message = {
      videoId,
      videoUrl,
      userEmail,
    } satisfies VideoIngestedMessage;

    this.channel.publish(exchangeName, routingKeys.videoIngested, Buffer.from(JSON.stringify(message)));

    return {
      id: videoId,
      url: videoUrl,
    };
  }
}
