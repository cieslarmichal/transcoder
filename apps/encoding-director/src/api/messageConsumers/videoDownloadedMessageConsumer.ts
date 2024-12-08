import { Value } from '@sinclair/typebox/value';

import { type ConsumePayload, type MessageConsumer } from '@libs/amqp';
import { videoDownloadedMessageSchema } from '@libs/contracts';

import { type RequestVideoEncodingsAction } from '../../actions/requestVideoEncodingsAction/requestVideoEncodingsAction.js';

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
