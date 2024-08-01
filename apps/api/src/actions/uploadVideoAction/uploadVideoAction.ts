import { type Readable } from 'node:stream';

import { type Logger } from '@common/logger';
import { type S3Service } from '@common/s3';

import { type UuidService } from '../../common/uuid/uuidService.js';
import { type Config } from '../../config.js';

export interface UploadVideoActionPayload {
  readonly data: Readable;
  readonly contentType: string;
  readonly notificationEmail: string;
}

export interface UploadVideoActionResult {
  readonly traceId: string;
}

export class UploadVideoAction {
  public constructor(
    private readonly s3Service: S3Service,
    private readonly uuidService: UuidService,
    private readonly config: Config,
    private readonly logger: Logger,
  ) {}

  public async execute(payload: UploadVideoActionPayload): Promise<UploadVideoActionResult> {
    const { contentType, data, notificationEmail } = payload;

    const { bucketName } = this.config.aws;

    this.logger.debug({
      message: 'Uploading video...',
      bucketName,
      contentType,
      notificationEmail,
    });

    const traceId = this.uuidService.generateUuid();

    await this.s3Service.uploadBlob({
      bucketName,
      blobName: traceId,
      data,
      contentType,
    });

    this.logger.debug({
      message: 'Video uploaded.',
      bucketName,
      contentType,
    });

    // TODO: send rabbitmq message

    return { traceId };
  }
}
