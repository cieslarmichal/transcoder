import { Value } from '@sinclair/typebox/value';

import { type ConsumePayload, type MessageConsumer } from '@libs/amqp';
import { videoIngestedMessageSchema } from '@libs/contracts';

import { type DownloadVideoAction } from '../../actions/downloadVideoAction/downloadVideoAction.js';

export class VideoIngestedMessageConsumer implements MessageConsumer {
  public constructor(private readonly downloadVideoAction: DownloadVideoAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { videoUrl, videoId, videoContainer } = Value.Decode(videoIngestedMessageSchema, payload.message);

    await this.downloadVideoAction.execute({
      videoUrl,
      videoId,
      videoContainer,
    });
  }
}
