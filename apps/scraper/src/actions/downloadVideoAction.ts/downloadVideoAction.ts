import { type Logger } from '@common/logger';

export interface DownloadVideoActionPayload {
  readonly url: string;
}

export class DownloadVideoAction {
  public constructor(private readonly logger: Logger) {}

  public async execute(payload: DownloadVideoActionPayload): Promise<void> {
    const { url } = payload;

    this.logger.debug({
      message: 'Downloading video...',
      url,
    });

    this.logger.info({
      message: 'Video downloaded',
      url,
    });
  }
}
