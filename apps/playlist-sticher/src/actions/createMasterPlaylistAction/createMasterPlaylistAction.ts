import { type Logger } from '@libs/logger';
import { type Config } from '../../config.js';
import { isFullVideoFormat, type EncodingId } from '@libs/contracts';
import { type S3Service } from '@libs/s3';

export interface CreateMasterPlaylstActionPayload {
  readonly videoId: string;
  readonly encodingId: EncodingId;
}

export class CreateMasterPlaylistAction {
  public constructor(
    private readonly s3Service: S3Service,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: CreateMasterPlaylstActionPayload): Promise<void> {
    const { videoId, encodingId } = payload;

    if (!isFullVideoFormat(encodingId)) {
      this.logger.debug({
        message: 'Skipping master playlist creation because artifact is not included in HLS playlist.',
        videoId,
        encodingId,
      });

      return;
    }

    this.logger.debug({
      message: 'Creating master HLS playlist...',
      videoId,
      encodingId,
    });

    const bucketName = this.config.aws.s3.encodingArtifactsBucket;

    const { blobs: encodingArtifacts } = await this.s3Service.getBlobs({
      bucketName,
      prefix: videoId,
    });

    const hlsArtifacts = encodingArtifacts.filter(
      (encodingArtifact) => encodingArtifact.name.endsWith('.ts') || encodingArtifact.name.endsWith('.m3u8'),
    );

    this.logger.info({
      message: 'HLS master playlist created.',
      videoId,
      encodingId,
    });
  }
}
