import { type ConsumePayload, type MessageConsumer } from '@libs/amqp';
import { type RequestVideoEncodingsAction } from '../../actions/requestVideoEncodingsAction/requestVideoEncodingsAction.js';
import { Value } from '@sinclair/typebox/value';
import { videoDownloadedMessageSchema } from '@libs/contracts';

export class VideoDownloadedMessageConsumer implements MessageConsumer {
  public constructor(private readonly requestVideoEncodingsAction: RequestVideoEncodingsAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { location, videoId, videoContainer } = Value.Decode(videoDownloadedMessageSchema, payload.message);

    await this.requestVideoEncodingsAction.execute({
      location,
      videoId,
      videoContainer,
    });
  }
}
