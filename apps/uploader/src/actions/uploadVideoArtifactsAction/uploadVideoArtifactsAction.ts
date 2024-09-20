import { type Logger } from '@libs/logger';
import { type Config } from '../../config.js';
import {
  type EncodingId,
  exchangeName,
  isEncodingContainer,
  mapEncodingContainerToContentType,
  routingKeys,
  type VideoArtifactsUploadedMessage,
} from '@libs/contracts';
import { type AmqpChannel } from '@libs/amqp';
import { type S3Service } from '@libs/s3';
import { createReadStream } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

export interface UploadVideoArtifactsActionPayload {
  readonly videoId: string;
  readonly artifactsDirectory: string;
  readonly encodingId: EncodingId;
}

export class UploadVideoArtifactsAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly s3Service: S3Service,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: UploadVideoArtifactsActionPayload): Promise<void> {
    const { videoId, artifactsDirectory, encodingId } = payload;

    this.logger.debug({
      message: 'Uploading video artifacts...',
      videoId,
      artifactsDirectory,
      encodingId,
    });

    const files = await readdir(artifactsDirectory);

    await Promise.all(
      files.map(async (fileName) => {
        const extension = fileName.split('.').pop();

        if (!isEncodingContainer(extension)) {
          this.logger.warn({
            message: 'Unsupported artifact extension.',
            videoId,
            fileName,
          });

          return;
        }

        const fullPath = join(artifactsDirectory, fileName);

        const contentType = mapEncodingContainerToContentType(extension);

        await this.s3Service.uploadBlob({
          bucketName: this.config.aws.s3.encodingArtifactsBucket,
          blobName: `${videoId}/${encodingId}/${fileName}`,
          data: createReadStream(fullPath),
          contentType,
        });
      }),
    );

    this.logger.info({
      message: 'Video artifacts uploaded.',
      videoId,
      artifactsDirectory,
      encodingId,
    });

    try {
      await rm(artifactsDirectory, { recursive: true, force: true });

      this.logger.debug({
        message: 'Directory removed from shared storage.',
        artifactsDirectory,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to remove directory from shared storage.',
        artifactsDirectory,
        error,
      });
    }

    const message = {
      videoId,
      encodingId,
    } satisfies VideoArtifactsUploadedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoArtifactUploaded, Buffer.from(JSON.stringify(message)));
  }
}
