import { type Logger } from '@common/logger';
import { type Config } from '../../config.js';
import {
  EncodingId,
  exchangeName,
  routingKeys,
  type VideoEncodedMessage,
  type VideoContainer,
  type EncodingSpecification,
  isTranscodingEncodingId,
  isPreviewEncodingId,
} from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import { type RedisClient } from '@common/redis';
import { OperationNotValidError } from '@common/errors';

export interface EncodeVideoActionPayload {
  readonly videoId: string;
  readonly location: string;
  readonly videoContainer: VideoContainer;
  readonly encoding: EncodingSpecification;
}

interface GetVideoDurationPayload {
  readonly videoPath: string;
}

interface TranscodeVideoPayload {
  readonly location: string;
  readonly outputPath: string;
  readonly encoding: EncodingSpecification;
  readonly videoDuration: number;
  readonly redisProgressKey: string;
}

interface GeneratePreviewPayload {
  readonly location: string;
  readonly outputPath: string;
  readonly encoding: EncodingSpecification;
}

interface GenerateThumbnailsPayload {
  readonly location: string;
  readonly outputPath: string;
  readonly videoId: string;
}

interface FfmpegProgressEvent {
  readonly frames: number;
  readonly currentFps: number;
  readonly currentKbps: number;
  readonly targetSize: number;
  readonly timemark: string;
  readonly percent?: number | undefined;
}

export class EncodeVideoAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
    private readonly redisClient: RedisClient,
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  public async execute(payload: EncodeVideoActionPayload): Promise<void> {
    const { videoId, location, videoContainer, encoding } = payload;

    this.logger.debug({
      message: 'Encoding video...',
      videoId,
      location,
      videoContainer,
      encodingId: encoding.id,
    });

    const outputPath = `${this.config.sharedDirectory}/${videoId}-${encoding.id}.${encoding.container}`;

    const videoDuration = await this.getVideoDuration({ videoPath: location });

    const redisProgressKey = `${videoId}-encoding-progress`;

    await this.redisClient.hset(redisProgressKey, { [encoding.id]: '0%' });

    if (isTranscodingEncodingId(encoding.id)) {
      await this.transcodeVideo({
        location,
        outputPath,
        encoding,
        videoDuration,
        redisProgressKey,
      });
    } else if (isPreviewEncodingId(encoding.id)) {
      await this.generatePreview({
        location,
        outputPath,
        encoding,
      });
    } else if (encoding.id === EncodingId.thumbnail) {
      await this.generateThumbnails({
        location,
        outputPath,
        videoId,
      });
    } else {
      throw new OperationNotValidError({
        reason: 'Encoding id not supported.',
        id: encoding.id,
      });
    }

    await this.redisClient.hset(redisProgressKey, { [encoding.id]: '100%' });

    this.logger.info({
      message: 'Video encoded.',
      videoId,
      encodingId: encoding.id,
      outputPath,
    });

    const message = {
      videoId,
      location: outputPath,
      encoding: {
        id: encoding.id,
        container: encoding.container,
      },
    } satisfies VideoEncodedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoEncoded, Buffer.from(JSON.stringify(message)));
  }

  private async getVideoDuration(payload: GetVideoDurationPayload): Promise<number> {
    const { videoPath } = payload;

    ffmpeg().setFfprobePath(ffprobePath.path);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (error, videoInfo) => {
        if (error) {
          return reject(error);
        }

        const { duration } = videoInfo.format;

        return resolve(Math.floor(Number(duration)));
      });
    });
  }

  private async transcodeVideo(payload: TranscodeVideoPayload): Promise<void> {
    const { location, outputPath, encoding, videoDuration, redisProgressKey } = payload;

    await new Promise((resolve, reject) => {
      ffmpeg()
        .setFfmpegPath(ffmpegPath as unknown as string)
        .input(location)
        .inputOptions('-y')
        .outputOptions([`-s ${encoding.width}x${encoding.height}`, `-b:v ${encoding.bitrate}k`, `-r ${encoding.fps}`])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .on('progress', async (event: FfmpegProgressEvent) => {
          console.log({ transProgress: event });

          const percentageProgress = this.calculatePercentageProgress(event, videoDuration);

          await this.redisClient.hset(redisProgressKey, { [encoding.id]: `${percentageProgress}%` });
        })
        .run();
    });
  }

  private async generatePreview(payload: GeneratePreviewPayload): Promise<void> {
    const { location, outputPath, encoding } = payload;

    await new Promise((resolve, reject) => {
      ffmpeg()
        .setFfmpegPath(ffmpegPath as unknown as string)
        .input(location)
        .outputOptions([
          '-y',
          '-ss 00:00:00',
          '-t 4',
          '-an',
          '-vf',
          `scale=${encoding.width}:${encoding.height}`,
          `-b:v ${encoding.bitrate}k`,
          `-r ${encoding.fps}`,
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  private async generateThumbnails(payload: GenerateThumbnailsPayload): Promise<void> {
    const { location, outputPath, videoId } = payload;

    await new Promise<void>((resolve, reject) => {
      const tempDir = '/tmp';

      const tempPattern = `${tempDir}/${videoId}_thumb%03d.png`;

      ffmpeg()
        .setFfmpegPath(ffmpegPath as unknown as string)
        .input(location)
        .outputOptions(['-y', '-vf', 'fps=1/10,scale=320:240', '-frames:v 800'])
        .output(tempPattern)
        .on('end', async () => {
          await new Promise((resolveCombine, rejectCombine) => {
            ffmpeg()
              .setFfmpegPath(ffmpegPath as unknown as string)
              .input(tempPattern)
              .outputOptions(['-y', '-filter_complex', 'tile=20x40'])
              .output(outputPath)
              .on('end', resolveCombine)
              .on('error', rejectCombine)

              .run();
          });

          resolve();
        })
        .on('error', reject)
        .run();
    });
  }

  private calculatePercentageProgress(progressEvent: FfmpegProgressEvent, videoDuration: number): number {
    if (progressEvent.percent !== undefined) {
      return Math.floor(progressEvent.percent);
    }

    const timeParts = progressEvent.timemark.split(':');

    const hours = parseInt(timeParts[0] as string, 10);

    const minutes = parseInt(timeParts[1] as string, 10);

    const seconds = parseInt(timeParts[2] as string, 10);

    const currentTimeInSeconds = hours * 3600 + minutes * 60 + seconds;

    return Math.floor(currentTimeInSeconds / videoDuration) * 100;
  }
}
