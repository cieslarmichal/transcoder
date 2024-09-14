import { AmqpProvisioner, MessageConsumerExecutor } from '@common/amqp';
import { type Logger, LoggerFactory } from '@common/logger';

import { type Config, ConfigFactory } from './config.js';
import { type Channel, type Connection } from 'amqplib';
import { exchangeName, queueNames, routingKeys } from '@common/contracts';
import { VideoIngestedMessageHandler } from './api/messageConsumers/videoIngestedMessageConsumer.js';
import { DownloadVideoAction } from './actions/downloadVideoAction.ts/downloadVideoAction.js';

export class Application {
  private readonly config: Config;
  private readonly logger: Logger;
  private amqpConnection: Connection | undefined;
  private amqpChannel: Channel | undefined;
  private readonly amqpProvisioner: AmqpProvisioner;

  public constructor() {
    this.config = ConfigFactory.create();

    this.logger = LoggerFactory.create({
      appName: this.config.appName,
      logLevel: this.config.logLevel,
    });

    this.amqpProvisioner = new AmqpProvisioner(this.logger);
  }

  public async start(): Promise<void> {
    await this.setupAmqp();

    const downloadVideoAction = new DownloadVideoAction(this.logger, this.config);

    const messageConsumer = new VideoIngestedMessageHandler(downloadVideoAction);

    const messageConsumerExecutor = new MessageConsumerExecutor(
      messageConsumer,
      this.amqpChannel as Channel,
      this.logger,
      queueNames.ingestedVideos,
      this.config.amqp.redeliveryDropThreshold,
    );

    await messageConsumerExecutor.startConsuming();
  }

  public async stop(): Promise<void> {
    await this.amqpConnection?.close();
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

    await this.amqpProvisioner.createQueue({
      channel: this.amqpChannel,
      exchangeName,
      queueName: queueNames.downloadedVideos,
      pattern: routingKeys.videoDownloaded,
      dlqMessageTtl: this.config.amqp.messageTtl,
    });
  }
}
