import { bucketNames } from '@common/contracts';
import { type Logger } from '@common/logger';
import { type S3Service } from '@common/s3';

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
  ) {}

  public async execute(
    payload: GetVideoEncodingArtifactsActionPayload,
  ): Promise<GetVideoEncodingArtifactsActionResult> {
    const { videoId } = payload;

    this.logger.debug({
      message: 'Fetching video encoding artifacts...',
      bucketName: bucketNames.encodingArtifacts,
      videoId,
    });

    const encodingArtifacts = await this.s3Service.getBlobsUrls({
      bucketName: bucketNames.encodingArtifacts,
      prefix: videoId,
    });

    this.logger.debug({
      message: 'Video encoding artifacts fetched.',
      videoId,
      bucketName: bucketNames.encodingArtifacts,
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
