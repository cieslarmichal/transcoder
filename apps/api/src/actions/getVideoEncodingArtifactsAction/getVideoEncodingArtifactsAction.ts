import { type Logger } from '@libs/logger';
import { type S3Service } from '@libs/s3';
import { type Config } from '../../config.js';

export interface GetVideoEncodingArtifactsActionPayload {
  readonly videoId: string;
}

export interface GetVideoEncodingArtifactsActionResult {
  readonly encodingArtifacts: {
    readonly id: string;
    readonly contentType: string;
    readonly url: string;
  }[];
}

export class GetVideoEncodingArtifactsAction {
  public constructor(
    private readonly s3Service: S3Service,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(
    payload: GetVideoEncodingArtifactsActionPayload,
  ): Promise<GetVideoEncodingArtifactsActionResult> {
    const { videoId } = payload;

    const bucketName = this.config.aws.s3.encodingArtifactsBucket;

    this.logger.debug({
      message: 'Fetching video encoding artifacts...',
      bucketName,
      videoId,
    });

    const encodingArtifacts = await this.s3Service.getBlobsUrls({
      bucketName,
      prefix: videoId,
    });

    this.logger.debug({
      message: 'Video encoding artifacts fetched.',
      videoId,
      bucketName,
      count: encodingArtifacts.length,
    });

    return {
      encodingArtifacts: encodingArtifacts.map(({ name, url, contentType }) => ({
        id: name.replace(`${videoId}/`, ''),
        url,
        contentType,
      })),
    };
  }
}
