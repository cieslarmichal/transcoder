import { type Channel, type Message } from 'amqplib';
import { type MessageConsumer } from './messageConsumer.js';
import { type Logger } from '@common/logger';

export class MessageConsumerExecutor {
  public constructor(
    private readonly messageConsumer: MessageConsumer,
    private readonly channel: Channel,
    private readonly logger: Logger,
    private readonly queueName: string,
    private readonly redeliveryDropThreshold: number,
  ) {}

  public async startConsuming(): Promise<void> {
    const consumerWrapper = async (message: Message | null): Promise<void> => {
      if (message === null) {
        return;
      }

      const parsedMessage = JSON.parse(message.content.toString());

      const { routingKey } = message.fields;

      try {
        this.logger.debug({ message: 'Consuming message...', routingKey, content: parsedMessage });

        await this.messageConsumer.consume({
          message: parsedMessage,
          routingKey,
        });

        this.channel.ack(message);

        this.logger.debug({ message: 'Message consumed.', routingKey, content: parsedMessage });
      } catch (error) {
        const redeliveryDropThreshold = this.redeliveryDropThreshold;

        const dropMessage = message.properties.headers?.['x-death']?.find(
          ({ count, reason }) => reason === 'rejected' && count > redeliveryDropThreshold,
        );

        if (dropMessage) {
          this.logger.error({
            message: 'Message dropped due to redelivery count threshold exceeded.',
            routingKey,
            content: parsedMessage,
            error,
          });

          this.channel.ack(message);

          return;
        } else {
          this.logger.error({ message: 'Error while consuming message.', error });

          this.channel.reject(message, false);
        }
      }
    };

    await this.channel.consume(this.queueName, consumerWrapper);

    this.logger.info({ message: 'Message consumer started.', queueName: this.queueName });
  }
}
