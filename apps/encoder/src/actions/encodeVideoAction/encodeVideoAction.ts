import { type Logger } from '@common/logger';
import { type Config } from '../../config.js';
import {
  EncodingId,
  exchangeName,
  routingKeys,
  type VideoEncodedMessage,
  type EncodingContainer,
  type VideoContainer,
} from '@common/contracts';
import { type AmqpChannel } from '@common/amqp';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

export interface EncodeVideoActionPayload {
  readonly videoId: string;
  readonly location: string;
  readonly videoContainer: VideoContainer;
  readonly encoding: {
    readonly id: EncodingId;
    readonly container: EncodingContainer;
    readonly width: number;
    readonly height: number;
    readonly bitrate: number;
    readonly fps: number;
  };
}

export class EncodeVideoAction {
  public constructor(
    private readonly amqpChannel: AmqpChannel,
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

    if ([EncodingId['360p'], EncodingId['480p'], EncodingId['720p'], EncodingId['1080p']].includes(encoding.id)) {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .setFfmpegPath(ffmpegPath as unknown as string)
          .input(location)
          .inputOptions('-y')
          .outputOptions([`-s ${encoding.width}x${encoding.height}`, `-b:v ${encoding.bitrate}k`, `-r ${encoding.fps}`])
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    } else if (
      [
        EncodingId['preview'],
        EncodingId['preview_360p'],
        EncodingId['preview_480p'],
        EncodingId['preview_720p'],
        EncodingId['preview_1080p'],
      ].includes(encoding.id)
    ) {
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
    } else {
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

    this.logger.info({
      message: 'Video encoded.',
      videoId,
      encodingId: encoding.id,
      outputPath,
    });

    const message = {
      videoId,
      location: outputPath,
      encodingId: encoding.id,
    } satisfies VideoEncodedMessage;

    this.amqpChannel.publish(exchangeName, routingKeys.videoEncoded, Buffer.from(JSON.stringify(message)));
  }
}
