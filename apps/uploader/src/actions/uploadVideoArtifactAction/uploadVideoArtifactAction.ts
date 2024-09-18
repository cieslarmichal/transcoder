import { type Logger } from '@common/logger';
import { type Config } from '../../config.js';
import {
  type EncodingContainer,
  type EncodingId,
  exchangeName,
  mapEncodingContainerToContentType,
  routingKeys,
  type VideoArtifactUploadedMessage,
} from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';
import { type S3Service } from '@common/s3';
import { createReadStream } from 'node:fs';

export interface UploadVideoArtifactActionPayload {
  readonly videoId: string;
  readonly location: string;
  readonly encoding: {
    readonly id: EncodingId;
    readonly container: EncodingContainer;
  };
}

export class UploadVideoArtifactAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly s3Service: S3Service,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: UploadVideoArtifactActionPayload): Promise<void> {
    const { videoId, location, encoding } = payload;

    this.logger.debug({
      message: 'Uploading video artifact...',
      videoId,
      location,
      encodingId: encoding.id,
    });

    const contentType = mapEncodingContainerToContentType(encoding.container);

    const fileName = `${encoding.id}.${encoding.container}`;

    const blobName = `${videoId}/${fileName}`;

    const { location: videoArtifactUrl } = await this.s3Service.uploadBlob({
      bucketName: this.config.aws.s3.encodingArtifactsBucket,
      blobName,
      sourceName: fileName,
      data: createReadStream(location),
      contentType,
    });

    this.logger.info({
      message: 'Video artifact uploaded.',
      videoId,
      encodingId: encoding.id,
      videoArtifactUrl,
    });

    const message = {
      videoId,
      encodingId: encoding.id,
      videoArtifactUrl,
    } satisfies VideoArtifactUploadedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoArtifactUploaded, Buffer.from(JSON.stringify(message)));
  }
}
