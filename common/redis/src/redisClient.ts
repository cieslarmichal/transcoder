import { type Logger } from '@common/logger';
import { Redis } from 'ioredis';

export interface RedisClientConfig {
  readonly host: string;
  readonly port: number;
}

export type RedisClient = Redis;

export class RedisClientFactory {
  public constructor(private readonly logger: Logger) {}

  public create(config: RedisClientConfig): RedisClient {
    const client = new Redis({
      host: config.host,
      port: config.port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    client.on('connect', () => {
      this.logger.info({ message: 'Redis client connected.' });
    });

    client.on('ready', () => {
      this.logger.info({ message: 'Redis client ready.' });
    });

    client.on('error', (error) => {
      this.logger.error({
        message: 'Redis error.',
        error,
      });
    });

    client.on('close', () => {
      this.logger.info({ message: 'Redis client connection closed.' });
    });

    client.on('reconnecting', () => {
      this.logger.info({ message: 'Redis client reconnecting.' });
    });

    client.on('end', () => {
      this.logger.info({ message: 'Redis client connection ended.' });
    });

    return client;
  }
}
