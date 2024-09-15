import { faker } from '@faker-js/faker';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { LoggerFactory } from '@common/logger';

import { ConfigFactory, type Config } from '../../config.js';
import { GetVideoEncodingArtifactsAction } from './getVideoEncodingArtifactsAction.js';
import { S3ClientFactory, S3Service } from '@common/s3';
import { S3TestUtils } from '@common/s3/tests';
import { join, resolve } from 'node:path';

describe('GetVideoEncodingArtifactsAction', () => {
  let action: GetVideoEncodingArtifactsAction;

  let config: Config;

  let s3TestUtils: S3TestUtils;

  const resourcesDirectory = resolve(__dirname, '../../../../../resources');

  const sampleFileName = 'sample_video1.mp4';

  beforeEach(async () => {
    config = ConfigFactory.create();

    const logger = LoggerFactory.create({
      appName: config.appName,
      logLevel: config.logLevel,
    });

    const s3Client = S3ClientFactory.create(config.aws);

    const s3Service = new S3Service(s3Client);

    action = new GetVideoEncodingArtifactsAction(s3Service, logger, config);

    s3TestUtils = new S3TestUtils(s3Client);

    await s3TestUtils.createBucket(config.aws.s3.encodingArtifactsBucket);
  });

  afterEach(async () => {
    await s3TestUtils.deleteBucket(config.aws.s3.encodingArtifactsBucket);
  });

  it('gets video encoding artifacts', async () => {
    const videoId = faker.string.uuid();

    const encoded360pBlobName = `${videoId}/360p`;

    const encodedPreviewBlobName = `${videoId}/preview`;

    const encodedPreview360pBlobName = `${videoId}/preview_360p`;

    const contentType = 'video/mp4';

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encoded360pBlobName,
      join(resourcesDirectory, sampleFileName),
      contentType,
    );

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encodedPreviewBlobName,
      join(resourcesDirectory, sampleFileName),
      contentType,
    );

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encodedPreview360pBlobName,
      join(resourcesDirectory, sampleFileName),
      contentType,
    );

    const { encodingArtifacts } = await action.execute({ videoId });

    encodingArtifacts.every((artifact) => {
      expect(artifact.url).toContain(config.aws.s3.encodingArtifactsBucket);

      expect(artifact.url).toContain(videoId);

      expect(['360p', 'preview', 'preview_360p'].some((id) => artifact.url.includes(id))).toBe(true);
    });

    expect(encodingArtifacts).toEqual([
      { id: '360p', url: expect.any(String), contentType },
      { id: 'preview', url: expect.any(String), contentType },
      { id: 'preview_360p', url: expect.any(String), contentType },
    ]);
  });

  it('returns empty array if video artifacts not found', async () => {
    const videoId = faker.string.uuid();

    const result = await action.execute({ videoId });

    expect(result.encodingArtifacts).toHaveLength(0);
  });
});
