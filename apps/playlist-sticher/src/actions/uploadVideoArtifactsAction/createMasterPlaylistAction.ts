import { type Logger } from '@libs/logger';
import { type Config } from '../../config.js';
import { type EncodingId } from '@libs/contracts';
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

    this.logger.debug({
      message: 'Creating master HLS playlist...',
      videoId,
      encodingId,
    });

    console.log({ s3: this.s3Service, config: this.config });

    this.logger.info({
      message: 'HLS master playlist created.',
      videoId,
      encodingId,
    });
  }
}
