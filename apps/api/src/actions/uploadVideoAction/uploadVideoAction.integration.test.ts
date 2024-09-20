import { faker } from '@faker-js/faker';
import { createReadStream } from 'node:fs';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';

import { LoggerFactory } from '@libs/logger';
import { S3ClientFactory, S3Service } from '@libs/s3';
import { S3TestUtils } from '@libs/s3/tests';

import { UploadVideoAction } from './uploadVideoAction.js';
import { ConfigFactory, type Config } from '../../config.js';
import { AmqpProvisioner, type AmqpChannel, type AmqpConnection, type AmqpGetMessageResult } from '@libs/amqp';
import { exchangeName, queueNames, routingKeys, type VideoIngestedMessage } from '@libs/contracts';
import { OperationNotValidError } from '@libs/errors';
import { type RedisClient, RedisClientFactory } from '@libs/redis';
import { type UuidService } from '@libs/uuid';

describe('UploadVideoAction', () => {
  let action: UploadVideoAction;

  let s3TestUtils: S3TestUtils;

  let config: Config;

  let amqpConnection: AmqpConnection;

  let amqpChannel: AmqpChannel;

  let redisClient: RedisClient;

  const resourcesDirectory = resolve(__dirname, '../../../../../resources');

  const sampleFileName = 'sample_video1.mp4';

  const filePath = join(resourcesDirectory, sampleFileName);

  const videoId = faker.string.uuid();

  beforeEach(async () => {
    const uuidService = {
      generateUuid: (): string => videoId,
    } satisfies UuidService;

    config = ConfigFactory.create();

    const logger = LoggerFactory.create({
      appName: config.appName,
      logLevel: config.logLevel,
    });

    const amqpProvisioner = new AmqpProvisioner(logger);

    amqpConnection = await amqpProvisioner.createConnection({
      url: config.amqp.url,
    });

    amqpChannel = await amqpProvisioner.createChannel({
      connection: amqpConnection,
    });

    await amqpProvisioner.createQueue({
      channel: amqpChannel,
      exchangeName,
      queueName: queueNames.ingestedVideos,
      pattern: routingKeys.videoIngested,
      dlqMessageTtl: config.amqp.messageTtl,
    });

    const s3Client = S3ClientFactory.create(config.aws);

    const s3Service = new S3Service(s3Client);

    s3TestUtils = new S3TestUtils(s3Client);

    redisClient = new RedisClientFactory(logger).create(config.redis);

    action = new UploadVideoAction(amqpChannel, s3Service, redisClient, uuidService, logger, config);

    await s3TestUtils.createBucket(config.aws.s3.ingestedVideosBucket);

    await amqpChannel.purgeQueue(queueNames.ingestedVideos);

    await redisClient.flushall();
  });

  afterEach(async () => {
    await s3TestUtils.deleteBucket(config.aws.s3.ingestedVideosBucket);

    await amqpChannel.purgeQueue(queueNames.ingestedVideos);

    await amqpConnection.close();

    await redisClient.flushall();
  });

  it('uploads a video', async () => {
    const userEmail = faker.internet.email();

    const blobName = `${videoId}.mp4`;

    const existsBefore = await s3TestUtils.objectExists(config.aws.s3.ingestedVideosBucket, blobName);

    expect(existsBefore).toBe(false);

    const result = await action.execute({
      data: createReadStream(filePath),
      fileName: 'sample_video1.mp4',
      userEmail,
    });

    const existsAfter = await s3TestUtils.objectExists(config.aws.s3.ingestedVideosBucket, blobName);

    expect(existsAfter).toBe(true);

    expect(result.videoId).toEqual(videoId);

    expect(result.videoUrl).toContain(config.aws.s3.ingestedVideosBucket);

    expect(result.videoUrl).toContain(blobName);

    const message = (await amqpChannel.get(queueNames.ingestedVideos)) as AmqpGetMessageResult;

    expect(message).not.toBe(false);

    const parsedMessage = JSON.parse(message.content.toString()) as VideoIngestedMessage;

    expect(parsedMessage.videoId).toEqual(videoId);

    expect(parsedMessage.videoContainer).toEqual('mp4');

    expect(parsedMessage.videoUrl).toContain(config.aws.s3.ingestedVideosBucket);

    expect(parsedMessage.videoUrl).toContain(blobName);

    const redisKey = `${videoId}-notification-email`;

    const notificationEmail = await redisClient.get(redisKey);

    expect(notificationEmail).toEqual(userEmail);
  });

  it('throws an error if the file has no extension', async () => {
    const userEmail = faker.internet.email();

    try {
      await action.execute({
        userEmail,
        fileName: 'sample_video1',
        data: createReadStream(filePath),
      });
    } catch (error) {
      expect(error).toBeInstanceOf(OperationNotValidError);

      return;
    }

    expect.fail();
  });

  it('throws an error if the file has an unsupported extension', async () => {
    const userEmail = faker.internet.email();

    try {
      await action.execute({
        userEmail,
        fileName: 'sample_video1.txt',
        data: createReadStream(filePath),
      });
    } catch (error) {
      expect(error).toBeInstanceOf(OperationNotValidError);

      return;
    }

    expect.fail();
  });
});
