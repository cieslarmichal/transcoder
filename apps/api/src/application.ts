import { AmqpProvisioner } from '@common/amqp';
import { type Logger, LoggerFactory } from '@common/logger';
import { S3ClientFactory, S3Service } from '@common/s3';

import { UploadVideoAction } from './actions/uploadVideoAction/uploadVideoAction.js';
import { ApplicationHttpController } from './api/httpControllers/applicationHttpController/applicationHttpController.js';
import { VideoHttpController } from './api/httpControllers/videoHttpController/videoHttpController.js';
import { UuidService } from './common/uuid/uuidService.js';
import { type Config, ConfigFactory } from './config.js';
import { HttpServer } from './httpServer.js';
import { type Channel, type Connection } from 'amqplib';
import { exchangeName, queueNames, routingKeys } from '@common/contracts';
import { RedisClientFactory, type RedisClient } from '@common/redis';
import { GetVideoEncodingProgressAction } from './actions/getVideoEncodingProgressAction/getVideoEncodingProgressAction.js';
import { GetVideoEncodingArtifactsAction } from './actions/getVideoEncodingArtifactsAction/getVideoEncodingArtifactsAction.js';

export class Application {
  private readonly config: Config;
  private readonly logger: Logger;
  private httpServer: HttpServer | undefined;
  private amqpConnection: Connection | undefined;
  private amqpChannel: Channel | undefined;
  private readonly amqpProvisioner: AmqpProvisioner;
  private readonly redisClient: RedisClient;

  public constructor() {
    this.config = ConfigFactory.create();

    this.logger = LoggerFactory.create({
      appName: this.config.appName,
      logLevel: this.config.logLevel,
    });

    this.amqpProvisioner = new AmqpProvisioner(this.logger);

    this.redisClient = new RedisClientFactory(this.logger).create(this.config.redis);
  }

  public async start(): Promise<void> {
    await this.setupAmqp();

    const uuidService = new UuidService();

    const s3Service = new S3Service(S3ClientFactory.create(this.config.aws));

    const applicationHttpController = new ApplicationHttpController();

    const uploadVideoAction = new UploadVideoAction(
      this.amqpChannel as Channel,
      s3Service,
      this.redisClient,
      uuidService,
      this.logger,
    );

    const getVideoEncodingProgressAction = new GetVideoEncodingProgressAction(this.redisClient, this.logger);

    const getVideoEncodingArtifactsAction = new GetVideoEncodingArtifactsAction(s3Service, this.logger);

    const videoHttpController = new VideoHttpController(
      uploadVideoAction,
      getVideoEncodingProgressAction,
      getVideoEncodingArtifactsAction,
    );

    this.httpServer = new HttpServer([applicationHttpController, videoHttpController], this.logger, this.config);

    await this.httpServer.start();

    await this.redisClient.ping();
  }

  public async stop(): Promise<void> {
    await this.httpServer?.stop();

    await this.amqpConnection?.close();

    await this.redisClient.quit();
  }

  private async setupAmqp(): Promise<void> {
    this.amqpConnection = await this.amqpProvisioner.createConnection({
      url: this.config.amqp.url,
    });

    this.amqpChannel = await this.amqpProvisioner.createChannel({
      connection: this.amqpConnection,
    });

    await this.amqpProvisioner.createQueue({
      channel: this.amqpChannel,
      exchangeName,
      queueName: queueNames.ingestedVideos,
      pattern: routingKeys.videoIngested,
      dlqMessageTtl: this.config.amqp.messageTtl,
    });
  }
}
