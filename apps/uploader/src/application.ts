import { type AmqpChannel, type AmqpConnection, AmqpProvisioner, MessageConsumerExecutor } from '@libs/amqp';
import { type Logger, LoggerFactory } from '@libs/logger';

import { type Config, ConfigFactory } from './config.js';
import { exchangeName, queueNames, routingKeys } from '@libs/contracts';
import { VideoEncodedMessageConsumer } from './api/messageConsumers/videoEncodedMessageConsumer.js';
import { S3Service, S3ClientFactory } from '@libs/s3';
import { UploadVideoArtifactsAction } from './actions/uploadVideoArtifactsAction/uploadVideoArtifactsAction.js';

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

    const s3Service = new S3Service(S3ClientFactory.create(this.config.aws));

    const uploadVideoArtifactsAction = new UploadVideoArtifactsAction(
      this.amqpChannel as AmqpChannel,
      s3Service,
      this.logger,
      this.config,
    );

    const messageConsumer = new VideoEncodedMessageConsumer(uploadVideoArtifactsAction);

    const messageConsumerExecutor = new MessageConsumerExecutor(
      messageConsumer,
      this.amqpChannel as AmqpChannel,
      this.logger,
      queueNames.encodedVideos,
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
      queueName: queueNames.encodedVideos,
      pattern: routingKeys.videoEncoded,
      dlqMessageTtl: this.config.amqp.messageTtl,
    });
  }
}
