import { createReadStream } from 'node:fs';
import path from 'path';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { S3ClientFactory } from './s3ClientFactory.js';
import { S3Service } from './s3Service.js';
import { S3TestUtils } from '../tests/s3TestUtils.js';
import { Generator } from '../../../tests/generator.js';
import { ConfigFactory } from '../../core/config.js';

describe('S3Service', () => {
  let s3Service: S3Service;

  let s3TestUtils: S3TestUtils;

  const resourcesDirectory = path.resolve(__dirname, '../../../../../../../resources');

  const sampleFileName1 = 'book1.jpg';

  const bucketName = 'misyma-images';

  beforeEach(async () => {
    const config = ConfigFactory.create();

    const s3Client = S3ClientFactory.create({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
      endpoint: config.aws.endpoint as string,
    });

    s3Service = new S3Service(s3Client);

    s3TestUtils = new S3TestUtils(s3Client);

    await s3TestUtils.createBucket(bucketName);
  });

  afterEach(async () => {
    await s3TestUtils.deleteBucket(bucketName);
  });

  describe('exists', () => {
    it('returns false - when bucket does not exist', async () => {
      const nonExistingBucketName = Generator.word();

      const resourceExists = await s3Service.blobExists({
        bucketName: nonExistingBucketName,
        blobName: sampleFileName1,
      });

      expect(resourceExists).toBe(false);
    });

    it('returns false - when resource does not exist', async () => {
      const nonExistingResourceName = Generator.word();

      const resourceExists = await s3Service.blobExists({
        bucketName,
        blobName: nonExistingResourceName,
      });

      expect(resourceExists).toBe(false);
    });

    it('returns true - when resource exists', async () => {
      await s3TestUtils.uploadObject(bucketName, sampleFileName1, path.join(resourcesDirectory, sampleFileName1));

      const resourceExists = await s3Service.blobExists({
        bucketName,
        blobName: sampleFileName1,
      });

      expect(resourceExists).toBe(true);
    });
  });

  describe('delete', () => {
    it('throws an error - when bucket does not exist', async () => {
      const nonExistingBucketName = Generator.word();

      try {
        await s3Service.deleteBlob({
          bucketName: nonExistingBucketName,
          blobName: sampleFileName1,
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('throws an error - when resource does not exist', async () => {
      const nonExistingResourceName = Generator.word();

      try {
        await s3Service.deleteBlob({
          bucketName,
          blobName: nonExistingResourceName,
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('deletes a resource', async () => {
      await s3TestUtils.uploadObject(bucketName, sampleFileName1, path.join(resourcesDirectory, sampleFileName1));

      const existsBefore = await s3TestUtils.objectExists(bucketName, sampleFileName1);

      expect(existsBefore).toBe(true);

      await s3Service.deleteBlob({
        bucketName,
        blobName: sampleFileName1,
      });

      const existsAfter = await s3TestUtils.objectExists(bucketName, sampleFileName1);

      expect(existsAfter).toBe(false);
    });
  });

  describe('upload', () => {
    it('throws an error - when bucket does not exist', async () => {
      const filePath = path.join(resourcesDirectory, sampleFileName1);

      const nonExistingBucketName = Generator.word();

      try {
        await s3Service.uploadBlob({
          bucketName: nonExistingBucketName,
          blobName: sampleFileName1,
          data: createReadStream(filePath),
          contentType: 'image/jpg',
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('uploads a resource', async () => {
      const filePath = path.join(resourcesDirectory, sampleFileName1);

      await s3Service.uploadBlob({
        bucketName,
        blobName: sampleFileName1,
        data: createReadStream(filePath),
        contentType: 'image/jpg',
      });

      const exists = await s3TestUtils.objectExists(bucketName, sampleFileName1);

      expect(exists).toBe(true);
    });
  });
});
