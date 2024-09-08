import { type Logger } from '@common/logger';
import { type Channel, connect, type Connection } from 'amqplib';

export interface CreateConnectionPayload {
  readonly url: string;
}

export interface CreateChannelPayload {
  readonly connection: Connection;
}

export interface CreateQueuePayload {
  readonly channel: Channel;
  readonly exchangeName: string;
  readonly queueName: string;
  readonly pattern: string;
  readonly dlqMessageTtl: number;
}

export class AmqpProvisioner {
  public constructor(private readonly logger: Logger) {}

  public async createConnection(payload: CreateConnectionPayload): Promise<Connection> {
    const { url } = payload;

    const connection = await connect(url);

    connection.addListener('close', () => {
      this.logger.debug({ message: 'AMQP connection closed.' });
    });

    connection.addListener('error', (error) => {
      this.logger.error({ message: 'AMQP connection error.', error });
    });

    connection.addListener('blocked', () => {
      this.logger.debug({ message: 'AMQP connection blocked.' });
    });

    connection.addListener('unblocked', () => {
      this.logger.debug({ message: 'AMQP connection unblocked.' });
    });

    return connection;
  }

  public async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    const { connection } = payload;

    const channel = await connection.createChannel();

    channel.addListener('close', () => {
      this.logger.debug({ message: 'AMQP channel closed.' });
    });

    channel.addListener('error', (error) => {
      this.logger.error({ message: 'AMQP channel error.', error });
    });

    channel.addListener('drain', () => {
      this.logger.debug({ message: 'AMQP channel drained.' });
    });

    await channel.prefetch(1, false);

    return channel;
  }

  public async createQueue(payload: CreateQueuePayload): Promise<void> {
    const { channel, exchangeName, queueName, pattern, dlqMessageTtl } = payload;

    const retryExchangeName = `${exchangeName}.retry`;

    await channel.assertExchange(exchangeName, 'topic');

    await channel.assertExchange(retryExchangeName, 'topic');

    await channel.assertQueue(queueName, {
      deadLetterExchange: retryExchangeName,
      messageTtl: dlqMessageTtl,
    });

    await channel.assertQueue(`${queueName}.retry`, {
      deadLetterExchange: retryExchangeName,
      messageTtl: dlqMessageTtl,
    });

    await channel.bindQueue(queueName, exchangeName, pattern);

    await channel.bindQueue(`${queueName}.retry`, retryExchangeName, pattern);
  }
}
