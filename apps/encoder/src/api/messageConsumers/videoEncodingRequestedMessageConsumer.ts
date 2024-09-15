import { type ConsumePayload, type MessageConsumer } from '@common/amqp';
import { type EncodeVideoAction } from '../../actions/encodeVideoAction/encodeVideoAction.js';
import { Value } from '@sinclair/typebox/value';
import { videoEncodingRequestedMessageSchema } from '@common/contracts';

export class VideoEncodingRequestedMessageConsumer implements MessageConsumer {
  public constructor(private readonly encodeVideoAction: EncodeVideoAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { videoId, location, videoContainer, encoding } = Value.Decode(
      videoEncodingRequestedMessageSchema,
      payload.message,
    );

    await this.encodeVideoAction.execute({
      videoId,
      location,
      videoContainer,
      encoding,
    });
  }
}
