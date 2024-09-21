import { faker } from '@faker-js/faker';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { LoggerFactory } from '@libs/logger';

import { ConfigFactory, type Config } from '../../config.js';
import { GetVideoEncodingArtifactsAction } from './getVideoEncodingArtifactsAction.js';
import { S3ClientFactory, S3Service } from '@libs/s3';
import { S3TestUtils } from '@libs/s3/tests';
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

    const encoded360pPlaylistName = `${videoId}/360p/playlist_360p.m3u8`;

    const m3u8ContentType = 'application/vnd.apple.mpegurl';

    const encoded360pVideoName = `${videoId}/360p/360p.ts`;

    const tsContentType = 'video/mp2t';

    const encodedPreviewBlobName = `${videoId}/preview/preview.mp4`;

    const encodedPreview360pBlobName = `${videoId}/preview_360p/preview_360p.mp4`;

    const mp4ContentType = 'video/mp4';

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encoded360pPlaylistName,
      join(resourcesDirectory, sampleFileName),
      m3u8ContentType,
    );

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encoded360pVideoName,
      join(resourcesDirectory, sampleFileName),
      tsContentType,
    );

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encodedPreviewBlobName,
      join(resourcesDirectory, sampleFileName),
      mp4ContentType,
    );

    await s3TestUtils.uploadObject(
      config.aws.s3.encodingArtifactsBucket,
      encodedPreview360pBlobName,
      join(resourcesDirectory, sampleFileName),
      mp4ContentType,
    );

    const { encodingArtifacts } = await action.execute({ videoId });

    const expectedS3Url = `https://${config.aws.s3.encodingArtifactsBucket}.s3.${config.aws.region}.amazonaws.com`;

    expect(encodingArtifacts).toEqual([
      { name: '360p.ts', url: `${expectedS3Url}/${videoId}/360p/360p.ts`, contentType: tsContentType },
      {
        name: 'playlist_360p.m3u8',
        url: `${expectedS3Url}/${videoId}/360p/playlist_360p.m3u8`,
        contentType: m3u8ContentType,
      },
      { name: 'preview.mp4', url: `${expectedS3Url}/${videoId}/preview/preview.mp4`, contentType: mp4ContentType },
      {
        name: 'preview_360p.mp4',
        url: `${expectedS3Url}/${videoId}/preview_360p/preview_360p.mp4`,
        contentType: mp4ContentType,
      },
    ]);
  });

  it('returns empty array if video artifacts not found', async () => {
    const videoId = faker.string.uuid();

    const result = await action.execute({ videoId });

    expect(result.encodingArtifacts).toHaveLength(0);
  });
});
