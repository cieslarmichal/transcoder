import { type Logger } from '@common/logger';
import axios from 'axios';
import { type Config } from '../../config.js';
import { createWriteStream } from 'node:fs';
import { OperationNotValidError } from '@common/errors';
import { exchangeName, routingKeys, type VideoDownloadedMessage } from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';
import { type VideoContainer } from '../../../../../common/contracts/src/amqp/messages/encodingContainer.js';

export interface DownloadVideoActionPayload {
  readonly videoId: string;
  readonly videoUrl: string;
  readonly videoContainer: VideoContainer;
}

export class DownloadVideoAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: DownloadVideoActionPayload): Promise<void> {
    const { videoId, videoUrl, videoContainer } = payload;

    this.logger.debug({
      message: 'Downloading video...',
      videoId,
      videoUrl,
      videoContainer,
    });

    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const contentType = response.headers['content-type'];

    if (!contentType) {
      throw new OperationNotValidError({
        reason: 'Missing content-type header.',
        headers: response.headers,
      });
    }

    const outputPath = `${this.config.sharedDirectory}/${videoId}.${videoContainer}`;

    const writer = createWriteStream(outputPath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);

      writer.on('error', reject);
    });

    const message = {
      videoId,
      location: outputPath,
      videoContainer,
    } satisfies VideoDownloadedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoDownloaded, Buffer.from(JSON.stringify(message)));

    this.logger.info({
      message: 'Video downloaded.',
      videoId,
      outputPath,
    });
  }
}
