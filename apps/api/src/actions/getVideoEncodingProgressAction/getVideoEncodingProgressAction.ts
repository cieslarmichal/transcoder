import { type Readable } from 'node:stream';

import { type Logger } from '@common/logger';

export interface UploadVideoActionPayload {
  readonly data: Readable;
  readonly contentType: string;
  readonly userEmail: string;
}

export interface UploadVideoActionResult {
  readonly videoId: string;
}

export class UploadVideoAction {
  public constructor(private readonly logger: Logger) {}

  public async execute(payload: UploadVideoActionPayload): Promise<UploadVideoActionResult> {
    const { contentType, data, userEmail } = payload;

    this.logger.debug({
      message: 'Fetching video encoding progress...',
      contentType,
      userEmail,
    });

    const progress = await this.redisClient.hGetAll(videoId);

    if (!progress) {
      throw new Error(`No encoding progress found for videoId: ${videoId}`);
    }

    return progress as { profile: string; progress: string };

    this.logger.debug({
      message: 'Video uploaded.',
      bucketName: bucketNames.ingestedVideos,
      contentType,
    });

    return { videoId: blobId };
  }
}
