import { type ConsumePayload, type MessageConsumer } from '@common/amqp';
import { type DownloadVideoAction } from '../../actions/downloadVideoAction/downloadVideoAction.js';
import { Value } from '@sinclair/typebox/value';
import { videoIngestedMessageSchema } from '@common/contracts';

export class VideoIngestedMessageConsumer implements MessageConsumer {
  public constructor(private readonly downloadVideoAction: DownloadVideoAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { videoUrl, videoId } = Value.Decode(videoIngestedMessageSchema, payload.message);

    await this.downloadVideoAction.execute({
      videoUrl,
      videoId,
    });
  }
}
