import { type ConsumePayload, type MessageConsumer } from '@libs/amqp';
import { Value } from '@sinclair/typebox/value';
import { videoArtifactsUploadedMessageSchema } from '@libs/contracts';
import { type CreateMasterPlaylistAction } from '../../actions/createMasterPlaylistAction/createMasterPlaylistAction.js';

export class VideoArtifactsUploadedMessageConsumer implements MessageConsumer {
  public constructor(private readonly createMasterPlaylistAction: CreateMasterPlaylistAction) {}

  public async consume(payload: ConsumePayload): Promise<void> {
    const { videoId, encodingId } = Value.Decode(videoArtifactsUploadedMessageSchema, payload.message);

    await this.createMasterPlaylistAction.execute({
      videoId,
      encodingId,
    });
  }
}
