/* eslint-disable @typescript-eslint/naming-convention */

import { type Readable } from 'node:stream';

import { type Logger } from '@common/logger';
import { type S3Service } from '@common/s3';

import { type UuidService } from '../../common/uuid/uuidService.js';
import { bucketNames, exchangeName, routingKeys, type VideoIngestedMessage } from '@common/contracts';
import { type Channel } from 'amqplib';
import { OperationNotValidError } from '@common/errors';

export interface UploadVideoActionPayload {
  readonly fileName: string;
  readonly data: Readable;
  readonly userEmail: string;
}

export interface UploadVideoActionResult {
  readonly videoId: string;
}

export class UploadVideoAction {
  private readonly videoExtensionToContentTypeMapping: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    webm: 'video/webm',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    '3gp': 'video/3gpp',
    ogg: 'video/ogg',
    ts: 'video/mp2t',
    m4v: 'video/x-m4v',
    m2ts: 'video/MP2T',
    vob: 'video/dvd',
    rm: 'application/vnd.rn-realmedia',
    rmvb: 'application/vnd.rn-realmedia-vbr',
    divx: 'video/divx',
    asf: 'video/x-ms-asf',
    swf: 'application/x-shockwave-flash',
    f4v: 'video/x-f4v',
  };

  public constructor(
    private readonly channel: Channel,
    private readonly s3Service: S3Service,
    private readonly uuidService: UuidService,
    private readonly logger: Logger,
  ) {}

  public async execute(payload: UploadVideoActionPayload): Promise<UploadVideoActionResult> {
    const { fileName, data, userEmail } = payload;

    this.logger.debug({
      message: 'Uploading video...',
      bucketName: bucketNames.ingestedVideos,
      fileName,
      userEmail,
    });

    const fileExtension = fileName.split('.').pop();

    if (!fileExtension) {
      throw new OperationNotValidError({
        reason: 'File has no extension.',
        fileName,
      });
    }

    const videoContentType = this.videoExtensionToContentTypeMapping[fileExtension];

    if (!videoContentType) {
      throw new OperationNotValidError({
        reason: 'File is not a video.',
        fileName,
      });
    }

    const videoId = this.uuidService.generateUuid();

    const blobName = `${videoId}/source`;

    await this.s3Service.uploadBlob({
      bucketName: bucketNames.ingestedVideos,
      blobName,
      sourceName: fileName,
      data,
      contentType: videoContentType,
    });

    this.logger.debug({
      message: 'Video uploaded.',
      blobName,
    });

    const message = {
      videoId,
      userEmail,
    } satisfies VideoIngestedMessage;

    this.channel.publish(exchangeName, routingKeys.videoIngested, Buffer.from(JSON.stringify(message)));

    return { videoId };
  }
}
