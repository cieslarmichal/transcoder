import { ResourceNotFoundError } from '@common/errors';
import { type Logger } from '@common/logger';
import { type RedisClient } from '@common/redis';

export interface GetVideoEncodingProgressActionPayload {
  readonly videoId: string;
}

export interface GetVideoEncodingProgressActionResult {
  readonly encodingProgress: { id: string; progress: string }[];
}

export class GetVideoEncodingProgressAction {
  public constructor(
    private readonly redisClient: RedisClient,
    private readonly logger: Logger,
  ) {}

  public async execute(payload: GetVideoEncodingProgressActionPayload): Promise<GetVideoEncodingProgressActionResult> {
    const { videoId } = payload;

    this.logger.debug({
      message: 'Fetching video encoding progress...',
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

    this.logger.debug({
      message: 'Video encoding progress fetched.',
      videoId,
      progress: encodingProgress,
    });

    const flatEncodingProgress = Object.entries(encodingProgress).map(([id, progress]) => ({
      id,
      progress,
    }));

    return { encodingProgress: flatEncodingProgress };
  }
}
