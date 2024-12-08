import { Value } from '@sinclair/typebox/value';

import { type ConsumePayload, type MessageConsumer } from '@libs/amqp';
import { videoEncodingRequestedMessageSchema } from '@libs/contracts';

import { type EncodeVideoAction } from '../../actions/encodeVideoAction/encodeVideoAction.js';

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
