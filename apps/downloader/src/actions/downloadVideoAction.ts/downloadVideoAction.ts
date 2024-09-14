import { type Logger } from '@common/logger';
import axios from 'axios';
import { type Config } from '../../config.js';
import { createWriteStream } from 'node:fs';

export interface DownloadVideoActionPayload {
  readonly videoId: string;
  readonly downloadUrl: string;
}

export class DownloadVideoAction {
  public constructor(
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: DownloadVideoActionPayload): Promise<void> {
    const { videoId, downloadUrl } = payload;

    const outputPath = `${this.config.sharedDirectory}/${videoId}.mp4`;

    const writer = createWriteStream(outputPath);

    this.logger.debug({
      message: 'Downloading video...',
      videoId,
      downloadUrl,
      outputPath,
    });

    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);

      writer.on('error', reject);
    });

    this.logger.info({
      message: 'Video downloaded',
      videoId,
      outputPath,
    });
  }
}
