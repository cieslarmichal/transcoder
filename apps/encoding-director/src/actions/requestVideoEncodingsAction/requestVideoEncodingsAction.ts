import { type Logger } from '@common/logger';
import { type Config } from '../../config.js';
import { exchangeName, routingKeys, type VideoEncodingRequestedMessage } from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';
import { type VideoContainer } from '../../../../../common/contracts/src/amqp/messages/encodingContainer.js';

export interface RequestVideoEncodingsActionPayload {
  readonly videoId: string;
  readonly location: string;
  readonly videoContainer: VideoContainer;
}

export class RequestVideoEncodingsAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: RequestVideoEncodingsActionPayload): Promise<void> {
    const { videoId, location, videoContainer } = payload;

    const encodingProfiles = this.config.encoding.profiles;

    this.logger.debug({
      message: 'Requesting video encodings...',
      videoId,
      videoContainer,
      encodingProfiles: encodingProfiles.map((profile) => profile.id),
    });

    encodingProfiles.map((profile) => {
      const message = {
        videoId,
        location,
        videoContainer,
        encoding: profile,
      } satisfies VideoEncodingRequestedMessage;

      this.amqpChannel.publish(exchangeName, routingKeys.videoEncodingRequested, Buffer.from(JSON.stringify(message)));
    });

    this.logger.info({
      message: 'Video encodings requested.',
      videoId,
      encodingProfiles: encodingProfiles.map((profile) => profile.id),
    });
  }
}
