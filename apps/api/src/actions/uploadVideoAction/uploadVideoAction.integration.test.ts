import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';

import { LoggerFactory } from '@common/logger';
import { S3ClientFactory, S3Service } from '@common/s3';
import { S3TestUtils } from '@common/s3/tests';

import { UploadVideoAction } from './uploadVideoAction.js';
import { type UuidService } from '../../common/uuid/uuidService.js';
import { ConfigFactory, type Config } from '../../config.js';
import { type GetMessage, type Channel, type Connection } from 'amqplib';
import { AmqpProvisioner } from '@common/amqp';
import { exchangeName, queueNames, routingKeys, bucketNames } from '@common/contracts';

describe('UploadVideoAction', () => {
  let action: UploadVideoAction;

  let s3TestUtils: S3TestUtils;

  let config: Config;

  let amqpConnection: Connection;

  let amqpChannel: Channel;

  const resourcesDirectory = resolve(__dirname, '../../../../../resources');

  const sampleFileName = 'sample_video1.mp4';

  const filePath = join(resourcesDirectory, sampleFileName);

  const videoId = randomUUID();

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

    action = new UploadVideoAction(amqpChannel, s3Service, uuidService, logger);

    await s3TestUtils.createBucket(bucketNames.ingestedVideos);
  });

  afterEach(async () => {
    await s3TestUtils.deleteBucket(bucketNames.ingestedVideos);

    await amqpConnection.close();
  });

  it('uploads a video', async () => {
    const userEmail = faker.internet.email();

    const existsBefore = await s3TestUtils.objectExists(bucketNames.ingestedVideos, videoId);

    expect(existsBefore).toBe(false);

    const { videoId: actualVideoId } = await action.execute({
      data: createReadStream(filePath),
      contentType: 'video/mp4',
      userEmail,
    });

    const existsAfter = await s3TestUtils.objectExists(bucketNames.ingestedVideos, videoId);

    expect(existsAfter).toBe(true);

    expect(actualVideoId).toEqual(videoId);

    const message = (await amqpChannel.get(queueNames.ingestedVideos)) as GetMessage;

    expect(message).not.toBe(false);

    const parsedMessage = JSON.parse(message.content.toString());

    expect(parsedMessage).toEqual({
      videoId,
      userEmail,
      url: `http://${bucketNames.ingestedVideos}.s3.localhost.localstack.cloud:4566/${videoId}`,
    });
  });
});
