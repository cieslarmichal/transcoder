import { LoggerFactory } from '@common/logger';
import { S3ClientFactory, S3Service } from '@common/s3';

import { UploadVideoAction } from './actions/uploadVideoAction/uploadVideoAction.js';
import { ApplicationHttpController } from './api/httpControllers/applicationHttpController/applicationHttpController.js';
import { VideoHttpController } from './api/httpControllers/videoHttpController/videoHttpController.js';
import { UuidService } from './common/uuid/uuidService.js';
import { type Config, ConfigFactory } from './config.js';
import { HttpServer } from './httpServer.js';
import { connect } from 'amqplib';

export class Application {
  private readonly config: Config;
  private readonly httpServer: HttpServer;

  public constructor() {
    this.config = ConfigFactory.create();

    const logger = LoggerFactory.create({
      appName: this.config.appName,
      logLevel: this.config.logLevel,
    });

    const uuidService = new UuidService();

    const s3Service = new S3Service(S3ClientFactory.create(this.config.aws));

    const applicationHttpController = new ApplicationHttpController();

    const uploadVideoAction = new UploadVideoAction(s3Service, uuidService, this.config, logger);

    const videoHttpController = new VideoHttpController(uploadVideoAction);

    this.httpServer = new HttpServer([applicationHttpController, videoHttpController], logger, this.config);
  }

  public async start(): Promise<void> {
    await this.httpServer.start();
  }

  public async stop(): Promise<void> {
    await this.httpServer.stop();
  }

  private async setupAmqp(): Promise<void> {
    const connection = await connect(this.config.amqp.url);

    const channel = await connection.createChannel();

    await channel.assertExchange('transcoder', 'direct', { durable: false });

    await ch1.assertQueue(queue);

    // Listener
    ch1.consume(queue, (msg) => {
      if (msg !== null) {
        console.log('Received:', msg.content.toString());

        ch1.ack(msg);
      } else {
        console.log('Consumer cancelled by server');
      }
    });
  }
}
