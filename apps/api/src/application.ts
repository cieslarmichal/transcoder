import { type Logger, LoggerFactory } from '@common/logger';
import { S3ClientFactory, S3Service } from '@common/s3';
import { exchangeName, queueNames, routingKeys } from '@common/contracts';

import { UploadVideoAction } from './actions/uploadVideoAction/uploadVideoAction.js';
import { ApplicationHttpController } from './api/httpControllers/applicationHttpController/applicationHttpController.js';
import { VideoHttpController } from './api/httpControllers/videoHttpController/videoHttpController.js';
import { UuidService } from './common/uuid/uuidService.js';
import { type Config, ConfigFactory } from './config.js';
import { HttpServer } from './httpServer.js';
import { connect, type Connection } from 'amqplib';

export class Application {
  private readonly config: Config;
  private readonly logger: Logger;
  private readonly httpServer: HttpServer;
  private amqpConnection: Connection | undefined;

  public constructor() {
    this.config = ConfigFactory.create();

    this.logger = LoggerFactory.create({
      appName: this.config.appName,
      logLevel: this.config.logLevel,
    });

    const uuidService = new UuidService();

    const s3Service = new S3Service(S3ClientFactory.create(this.config.aws));

    const applicationHttpController = new ApplicationHttpController();

    const uploadVideoAction = new UploadVideoAction(s3Service, uuidService, this.config, this.logger);

    const videoHttpController = new VideoHttpController(uploadVideoAction);

    this.httpServer = new HttpServer([applicationHttpController, videoHttpController], this.logger, this.config);
  }

  public async start(): Promise<void> {
    await this.httpServer.start();

    this.amqpConnection = await this.setupAmqp();
  }

  public async stop(): Promise<void> {
    await this.httpServer.stop();

    await this.amqpConnection?.close();
  }

  private async setupAmqp(): Promise<Connection> {
    const connection = await connect(this.config.amqp.url);

    connection.addListener('close', () => {
      this.logger.debug({ message: 'AMQP connection closed' });
    });

    connection.addListener('error', (error) => {
      this.logger.error({ message: 'AMQP connection error', error });
    });

    connection.addListener('blocked', () => {
      this.logger.debug({ message: 'AMQP connection blocked' });
    });

    connection.addListener('unblocked', () => {
      this.logger.debug({ message: 'AMQP connection unblocked' });
    });

    const channel = await connection.createChannel();

    channel.addListener('close', () => {
      this.logger.debug({ message: 'AMQP channel closed' });
    });

    channel.addListener('error', (error) => {
      this.logger.error({ message: 'AMQP channel error', error });
    });

    channel.addListener('drain', () => {
      this.logger.debug({ message: 'AMQP channel drained' });
    });

    await channel.assertExchange(exchangeName, 'topic');

    const retryExchangeName = `${exchangeName}.retry`;

    await channel.assertExchange(retryExchangeName, 'topic');

    await channel.assertQueue(queueNames.ingestedVideos, {
      deadLetterExchange: retryExchangeName,
      messageTtl: this.config.amqp.messageTtl,
    });

    await channel.assertQueue(`${queueNames.ingestedVideos}.retry`, {
      deadLetterExchange: retryExchangeName,
      messageTtl: this.config.amqp.messageTtl,
    });

    await channel.bindQueue(queueNames.ingestedVideos, exchangeName, routingKeys.videoIngested);

    await channel.bindQueue(`${queueNames.ingestedVideos}.retry`, retryExchangeName, routingKeys.videoIngested);

    return connection;
  }
}
