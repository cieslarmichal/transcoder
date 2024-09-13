import { ResourceNotFoundError } from '@common/errors';
import { type Logger } from '@common/logger';
import { type RedisClient } from '@common/redis';

export interface GetVideoEncodingArtifactsActionPayload {
  readonly videoId: string;
}

export interface GetVideoEncodingArtifactsActionResult {
  readonly encodingArtifacts: { id: string; url: string }[];
}

export class GetVideoEncodingArtifactsAction {
  public constructor(
    private readonly redisClient: RedisClient,
    private readonly logger: Logger,
  ) {}

  public async execute(
    payload: GetVideoEncodingArtifactsActionPayload,
  ): Promise<GetVideoEncodingArtifactsActionResult> {
    const { videoId } = payload;

    this.logger.debug({
      message: 'Fetching video encoding artifacts...',
      videoId,
    });

    const redisKey = `${videoId}-encoding-progress`;

    const encodingProgress = await this.redisClient.hgetall(redisKey);

    if (!encodingProgress) {
      throw new ResourceNotFoundError({
        resource: 'EncodingProgress',
        id: videoId,
      });
    }

    const encodedArtifacts = Object.entries(encodingProgress)
      .map(([id, progress]) => ({
        id,
        progress,
      }))
      .filter(({ progress }) => progress === '100%');

    this.logger.debug({
      message: 'Video encoding artifacts fetched.',
      videoId,
      encodedArtifacts: encodedArtifacts.map(({ id }) => id),
    });

    return { encodingArtifacts: flatEncodingArtifacts };
  }
}
