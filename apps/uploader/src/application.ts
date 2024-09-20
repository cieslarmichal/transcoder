import { type AmqpChannel, type AmqpConnection, AmqpProvisioner, MessageConsumerExecutor } from '@common/amqp';
import { type Logger, LoggerFactory } from '@common/logger';

import { type Config, ConfigFactory } from './config.js';
import { exchangeName, queueNames, routingKeys } from '@common/contracts';
import { UploadVideoArtifactAction } from './actions/uploadVideoArtifactsAction/uploadVideoArtifactAction.jss';
import { VideoEncodedMessageConsumer } from './api/messageConsumers/videoEncodedMessageConsumer.js';
import { S3Service, S3ClientFactory } from '@common/s3';

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

    const uploadVideoAction = new UploadVideoArtifactAction(
      this.amqpChannel as AmqpChannel,
      s3Service,
      this.logger,
      this.config,
    );

    const messageConsumer = new VideoEncodedMessageConsumer(uploadVideoAction);

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
