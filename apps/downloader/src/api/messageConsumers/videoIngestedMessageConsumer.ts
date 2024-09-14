import { type ConsumePayload, type MessageConsumer } from '@common/amqp';
import { type VideoIngestedMessage } from '@common/contracts';
import { type DownloadVideoAction } from '../../actions/downloadVideoAction.ts/downloadVideoAction.js';

export class VideoIngestedMessageHandler implements MessageConsumer<VideoIngestedMessage> {
  public constructor(private readonly downloadVideoAction: DownloadVideoAction) {}

  public async consume(payload: ConsumePayload<VideoIngestedMessage>): Promise<void> {
    const {
      message: { downloadUrl, videoId },
    } = payload;

    await this.downloadVideoAction.execute({
      downloadUrl,
      videoId,
    });
  }
}
