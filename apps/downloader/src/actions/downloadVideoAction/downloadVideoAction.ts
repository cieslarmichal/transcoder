/* eslint-disable @typescript-eslint/naming-convention */

import { type Logger } from '@common/logger';
import axios from 'axios';
import { type Config } from '../../config.js';
import { createWriteStream } from 'node:fs';
import { OperationNotValidError } from '@common/errors';
import { exchangeName, routingKeys, type VideoDownloadedMessage } from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';

export interface DownloadVideoActionPayload {
  readonly videoId: string;
  readonly videoUrl: string;
}

export class DownloadVideoAction {
  private readonly contentTypeToVideoExtensionMapping: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'video/x-ms-wmv': 'wmv',
    'video/x-flv': 'flv',
    'video/webm': 'webm',
    'video/mpeg': 'mpeg',
    'video/3gpp': '3gp',
    'video/ogg': 'ogg',
    'video/mp2t': 'ts',
    'video/x-m4v': 'm4v',
    'video/MP2T': 'm2ts',
    'video/dvd': 'vob',
    'application/vnd.rn-realmedia': 'rm',
    'application/vnd.rn-realmedia-vbr': 'rmvb',
    'video/divx': 'divx',
    'video/x-ms-asf': 'asf',
    'application/x-shockwave-flash': 'swf',
    'video/x-f4v': 'f4v',
  };

  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: DownloadVideoActionPayload): Promise<void> {
    const { videoId, videoUrl } = payload;

    this.logger.debug({
      message: 'Downloading video...',
      videoId,
    });

    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const contentType = response.headers['Content-Type'];

    if (!contentType) {
      throw new OperationNotValidError({
        reason: 'Content-Type header is missing.',
        headers: response.headers,
      });
    }

    const videoExtension = this.contentTypeToVideoExtensionMapping[contentType.toString()];

    if (!videoExtension) {
      throw new OperationNotValidError({
        reason: 'Video extension is not supported.',
        contentType,
      });
    }

    const outputPath = `${this.config.sharedDirectory}/${videoId}.${videoExtension}`;

    const writer = createWriteStream(outputPath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);

      writer.on('error', reject);
    });

    const message = {
      videoId,
      location: outputPath,
    } satisfies VideoDownloadedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoDownloaded, Buffer.from(JSON.stringify(message)));

    this.logger.info({
      message: 'Video downloaded',
      videoId,
      outputPath,
    });
  }
}
