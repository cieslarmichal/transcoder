import { type ConsumePayload, type MessageConsumer } from '@common/amqp';
import { Value } from '@sinclair/typebox/value';
import { videoEncodedMessageSchema } from '@common/contracts';
import { type UploadVideoArtifactAction } from '../../actions/uploadVideoArtifactAction/uploadVideoArtifactAction.js';

export class VideoEncodedMessageConsumer implements MessageConsumer {
  public constructor(private readonly uploadVideoArtifactAction: UploadVideoArtifactAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { videoId, location, encoding } = Value.Decode(videoEncodedMessageSchema, payload.message);

    await this.uploadVideoArtifactAction.execute({
      videoId,
      location,
      encoding,
    });
  }
}
