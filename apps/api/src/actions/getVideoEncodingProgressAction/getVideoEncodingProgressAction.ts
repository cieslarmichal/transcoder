import { ResourceNotFoundError } from '@common/errors';
import { type Logger } from '@common/logger';
import { type RedisClient } from '@common/redis';

export interface GetVideoEncodingProgressActionPayload {
  readonly videoId: string;
}

export interface GetVideoEncodingProgressActionResult {
  readonly encodingProgress: { profile: string; progress: string }[];
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

    const encodingProgress = await this.redisClient.hgetall(videoId);

    if (!encodingProgress) {
      throw new ResourceNotFoundError({
        resource: 'Video',
        id: videoId,
      });
    }

    this.logger.debug({
      message: 'Video encoding progress fetched.',
      videoId,
      progress: encodingProgress,
    });

    const flatEncodingProgress = Object.entries(encodingProgress).map(([profile, progress]) => ({
      profile,
      progress,
    }));

    return { encodingProgress: flatEncodingProgress };
  }
}
