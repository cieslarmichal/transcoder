import { faker } from '@faker-js/faker';
import { createReadStream } from 'node:fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { LoggerFactory } from '@common/logger';
import { S3ClientFactory, S3Service } from '@common/s3';
import { S3TestUtils } from '@common/s3/tests';

import { UploadVideoAction } from './uploadVideoAction.js';
import { type UuidService } from '../../common/uuid/uuidService.js';
import { ConfigFactory, type Config } from '../../config.js';

describe('UploadVideoAction', () => {
  let action: UploadVideoAction;

  let s3TestUtils: S3TestUtils;

  let config: Config;

  const resourcesDirectory = path.resolve(__dirname, '../../../../../resources');

  const sampleFileName = 'sample_video1.mp4';

  const bucketName = 'transcoder-artifacts';

  const filePath = path.join(resourcesDirectory, sampleFileName);

  const videoId = uuidv4();

  beforeEach(async () => {
    const uuidService = {
      generateUuid: (): string => videoId,
    } satisfies UuidService;

    config = ConfigFactory.create();

    const s3Client = S3ClientFactory.create(config.aws);

    const s3Service = new S3Service(s3Client);

    s3TestUtils = new S3TestUtils(s3Client);

    const logger = LoggerFactory.create({
      appName: config.appName,
      logLevel: config.logLevel,
    });

    action = new UploadVideoAction(s3Service, uuidService, config, logger);

    await s3TestUtils.createBucket(bucketName);
  });

  afterEach(async () => {
    await s3TestUtils.deleteBucket(bucketName);
  });

  it('uploads a video', async () => {
    const notificationEmail = faker.internet.email();

    const existsBefore = await s3TestUtils.objectExists(bucketName, videoId);

    expect(existsBefore).toBe(false);

    const { traceId } = await action.execute({
      data: createReadStream(filePath),
      contentType: 'video/mp4',
      notificationEmail,
    });

    const existsAfter = await s3TestUtils.objectExists(bucketName, videoId);

    expect(existsAfter).toBe(true);

    expect(traceId).toEqual(videoId);
  });
});
