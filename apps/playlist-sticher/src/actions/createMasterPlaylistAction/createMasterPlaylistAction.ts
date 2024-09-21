import { type Logger } from '@libs/logger';
import { type Config } from '../../config.js';
import { isFullVideoFormat, type EncodingId } from '@libs/contracts';
import { type S3Service } from '@libs/s3';
import { OperationNotValidError } from '@libs/errors';
import { unlink, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

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

    const bucketName = this.config.aws.s3.encodingArtifactsBucket;

    const { blobs: encodingArtifacts } = await this.s3Service.getBlobs({
      bucketName,
      prefix: videoId,
    });

    if (!encodingArtifacts.length) {
      this.logger.warn({
        message: 'No encoding artifacts found.',
        videoId,
      });

      return;
    }

    const hlsPlaylists = encodingArtifacts
      .filter(
        (encodingArtifact) => encodingArtifact.name.endsWith('.m3u8') && !encodingArtifact.name.includes('master'),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const resolutions = hlsPlaylists.map(
      (hlsPlaylist) => hlsPlaylist.name.split('/').pop()?.split('.')[0]?.replace('playlist_', '') as string,
    );

    this.logger.debug({
      message: 'Creating master HLS playlist...',
      videoId,
      encodingId,
      resolutions,
    });

    const masterPlaylistPath = `/tmp/${resolutions.join('_')}.m3u8`;

    let masterPlaylistContent = '#EXTM3U\n';

    for (const resolution of resolutions) {
      const videoWithResolution = encodingArtifacts.find(
        (encodingArtifact) => encodingArtifact.name.endsWith('.ts') && encodingArtifact.name.includes(resolution),
      );

      if (!videoWithResolution) {
        throw new OperationNotValidError({
          reason: 'Video artifact with given resolution not found.',
          videoId,
          resolution,
        });
      }

      const videoName = videoWithResolution.name.split('/').pop()?.split('.')[0];

      if (!videoName) {
        throw new OperationNotValidError({
          reason: 'Video artifact name has invalid format.',
          videoId,
          videoName,
        });
      }

      const [width, height, bitrate] = videoName.split('x');

      masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate},RESOLUTION=${width}x${height}\n`;

      const playlistPath = `${resolution}/playlist_${resolution}.m3u8`;

      masterPlaylistContent += `${playlistPath}\n`;
    }

    await writeFile(masterPlaylistPath, masterPlaylistContent);

    this.logger.debug({
      message: 'HLS master playlist created.',
      videoId,
      encodingId,
    });

    this.logger.debug({
      message: 'Uploading HLS master playlist to S3...',
      videoId,
      masterPlaylistPath,
    });

    await this.s3Service.uploadBlob({
      bucketName: this.config.aws.s3.encodingArtifactsBucket,
      blobName: `${videoId}/master_${resolutions.join('_')}.m3u8`,
      data: createReadStream(masterPlaylistPath),
      contentType: 'application/vnd.apple.mpegurl',
    });

    this.logger.info({
      message: 'HLS master playlist uploaded to S3.',
      videoId,
      masterPlaylistPath,
    });

    this.logger.debug({
      message: 'Removing temporary master playlist file...',
      videoId,
      masterPlaylistPath,
    });

    await unlink(masterPlaylistPath);

    this.logger.debug({
      message: 'Temporary master playlist file removed.',
      videoId,
      masterPlaylistPath,
    });
  }
}
