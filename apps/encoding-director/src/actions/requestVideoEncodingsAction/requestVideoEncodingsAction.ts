import { type Logger } from '@common/logger';
import { type Config } from '../../config.js';
import { exchangeName, routingKeys, type VideoEncodingRequestedMessage, type VideoContainer } from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';

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

    const encodingArtifacts = this.config.encoding.artifacts;

    this.logger.debug({
      message: 'Requesting video encodings...',
      videoId,
      videoContainer,
      encodingArtifacts: encodingArtifacts.map((artifact) => artifact.id),
    });

    encodingArtifacts.map((encodingArtifact) => {
      const message = {
        videoId,
        location,
        videoContainer,
        encoding: encodingArtifact,
      } satisfies VideoEncodingRequestedMessage;

      this.amqpChannel.publish(exchangeName, routingKeys.videoEncodingRequested, Buffer.from(JSON.stringify(message)));
    });

    this.logger.info({
      message: 'Video encodings requested.',
      videoId,
      encodingProfiles: encodingArtifacts.map((profile) => profile.id),
    });
  }
}
