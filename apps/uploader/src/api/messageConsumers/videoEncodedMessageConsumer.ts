import { type ConsumePayload, type MessageConsumer } from '@common/amqp';
import { Value } from '@sinclair/typebox/value';
import { videoEncodedMessageSchema } from '@common/contracts';
import { type UploadVideoArtifactsAction } from '../../actions/uploadVideoArtifactsAction/uploadVideoArtifactsAction.js';

export class VideoEncodedMessageConsumer implements MessageConsumer {
  public constructor(private readonly uploadVideoArtifactsAction: UploadVideoArtifactsAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { videoId, artifactsDirectory, encodingId } = Value.Decode(videoEncodedMessageSchema, payload.message);

    await this.uploadVideoArtifactsAction.execute({
      videoId,
      artifactsDirectory,
      encodingId,
    });
  }
}
