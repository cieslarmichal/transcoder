/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { ResourceNotFoundError } from '@libs/errors';
import { LoggerFactory } from '@libs/logger';
import { RedisClientFactory, type RedisClient } from '@libs/redis';

import { GetVideoEncodingProgressAction } from './getVideoEncodingProgressAction.js';
import { ConfigFactory, type Config } from '../../config.js';

describe('GetVideoEncodingProgressAction', () => {
  let action: GetVideoEncodingProgressAction;

  let config: Config;

  let redisClient: RedisClient;

  beforeEach(async () => {
    config = ConfigFactory.create();

    const logger = LoggerFactory.create({
      appName: config.appName,
      logLevel: config.logLevel,
    });

    redisClient = new RedisClientFactory(logger).create(config.redis);

    action = new GetVideoEncodingProgressAction(redisClient, logger);

    await redisClient.flushall();
  });

  afterEach(async () => {
    await redisClient.flushall();

    await redisClient.quit();
  });

  it('gets video encoding progress', async () => {
    const videoId = faker.string.uuid();

    const redisKey = `${videoId}-encoding-progress`;

    await redisClient.hset(redisKey, {
      '1080p': '75%',
      '720p': '55%',
      '480p': '30%',
      '360p': '10%',
      preview: '0%',
      preview_360p: '1%',
      preview_1080p: '3%',
    });

    const { encodingProgress } = await action.execute({ videoId });

    expect(encodingProgress).toEqual([
      { id: '1080p', progress: '75%' },
      { id: '720p', progress: '55%' },
      { id: '480p', progress: '30%' },
      { id: '360p', progress: '10%' },
      { id: 'preview', progress: '0%' },
      { id: 'preview_360p', progress: '1%' },
      { id: 'preview_1080p', progress: '3%' },
    ]);
  });

  it('throws error if video encoding progress not found', async () => {
    const videoId = faker.string.uuid();

    try {
      await action.execute({ videoId });
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceNotFoundError);

      return;
    }

    expect.fail();
  });
});
