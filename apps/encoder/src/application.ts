import { type AmqpChannel, type AmqpConnection, AmqpProvisioner, MessageConsumerExecutor } from '@libs/amqp';
import { type Logger, LoggerFactory } from '@libs/logger';

import { type Config, ConfigFactory } from './config.js';
import { exchangeName, queueNames, routingKeys } from '@libs/contracts';
import { EncodeVideoAction } from './actions/encodeVideoAction/encodeVideoAction.js';
import { VideoEncodingRequestedMessageConsumer } from './api/messageConsumers/videoEncodingRequestedMessageConsumer.js';
import { type RedisClient, RedisClientFactory } from '@libs/redis';

export class Application {
  private readonly config: Config;
  private readonly logger: Logger;
  private amqpConnection: AmqpConnection | undefined;
  private amqpChannel: AmqpChannel | undefined;
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

    const encodeVideoAction = new EncodeVideoAction(
      this.amqpChannel as AmqpChannel,
      this.redisClient,
      this.logger,
      this.config,
    );

    const messageConsumer = new VideoEncodingRequestedMessageConsumer(encodeVideoAction);

    const messageConsumerExecutor = new MessageConsumerExecutor(
      messageConsumer,
      this.amqpChannel as AmqpChannel,
      this.logger,
      queueNames.encodingRequests,
      this.config.amqp.redeliveryDropThreshold,
    );

    await messageConsumerExecutor.startConsuming();

    await this.redisClient.ping();
  }

  public async stop(): Promise<void> {
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
      queueName: queueNames.encodingRequests,
      pattern: routingKeys.videoEncodingRequested,
      dlqMessageTtl: this.config.amqp.messageTtl,
    });
  }
}
