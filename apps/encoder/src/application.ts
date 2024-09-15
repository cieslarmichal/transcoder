import { type AmqpChannel, type AmqpConnection, AmqpProvisioner, MessageConsumerExecutor } from '@common/amqp';
import { type Logger, LoggerFactory } from '@common/logger';

import { type Config, ConfigFactory } from './config.js';
import { exchangeName, queueNames, routingKeys } from '@common/contracts';
import { VideoIngestedMessageConsumer } from './api/messageConsumers/videoEncodingRequestedMessageConsumer.js';
import { DownloadVideoAction } from './actions/encodeVideoAction/encodeVideoAction.js';

export class Application {
  private readonly config: Config;
  private readonly logger: Logger;
  private amqpConnection: AmqpConnection | undefined;
  private amqpChannel: AmqpChannel | undefined;
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

    const downloadVideoAction = new DownloadVideoAction(this.amqpChannel as AmqpChannel, this.logger, this.config);

    const messageConsumer = new VideoIngestedMessageConsumer(downloadVideoAction);

    const messageConsumerExecutor = new MessageConsumerExecutor(
      messageConsumer,
      this.amqpChannel as AmqpChannel,
      this.logger,
      queueNames.encodingRequests,
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
      queueName: queueNames.encodingRequests,
      pattern: routingKeys.videoEncodingRequested,
      dlqMessageTtl: this.config.amqp.messageTtl,
    });
  }
}
