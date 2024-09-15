import { type Logger } from '@common/logger';
import { type Config } from '../../config.js';
import { exchangeName, routingKeys, type VideoEncodedMessage, type EncodingId } from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';
import { type VideoContainer } from '../../../../../common/contracts/src/amqp/messages/encodingContainer.js';

export interface EncodeVideoActionPayload {
  readonly videoId: string;
  readonly location: string;
  readonly videoContainer: VideoContainer;
  readonly encoding: {
    readonly id: EncodingId;
    readonly width: number;
    readonly height: number;
    readonly bitrate: number;
    readonly fps: number;
  };
}

export class EncodeVideoAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: EncodeVideoActionPayload): Promise<void> {
    const { videoId, location, videoContainer, encoding } = payload;

    this.logger.debug({
      message: 'Encoding video...',
      videoId,
      location,
      videoContainer,
      encodingId: encoding.id,
    });

    const outputPath = `${this.config.sharedDirectory}/${videoId}.${videoContainer}`;

    const message = {
      videoId,
      location: outputPath,
      encodingId: encoding.id,
    } satisfies VideoEncodedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoEncoded, Buffer.from(JSON.stringify(message)));

    this.logger.info({
      message: 'Video encoded',
      videoId,
      encodingId: encoding.id,
      outputPath,
    });
  }
}
