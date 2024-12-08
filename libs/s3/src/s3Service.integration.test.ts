import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'path';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { AwsRegion } from './awsRegion.js';
import { S3ClientFactory } from './s3ClientFactory.js';
import { S3Service } from './s3Service.js';
import { S3TestUtils } from '../tests/s3TestUtils.js';

describe('S3Service', () => {
  let s3Service: S3Service;

  let s3TestUtils: S3TestUtils;

  const resourcesDirectory = path.resolve(__dirname, '../../../resources');

  const sampleFileName = 'sample_image.jpg';

  const blobName = randomUUID();

  const bucketName = 'test-images';

  beforeEach(async () => {
    const s3Client = S3ClientFactory.create({
      accessKeyId: 'test',
      secretAccessKey: 'test',
      region: AwsRegion.euCentral1,
      endpoint: 'http://127.0.0.1:4566',
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
      const nonExistingBucketName = 'non-existing-bucket';

      const resourceExists = await s3Service.blobExists({
        bucketName: nonExistingBucketName,
        blobName,
      });

      expect(resourceExists).toBe(false);
    });

    it('returns false - when resource does not exist', async () => {
      const nonExistingResourceName = 'non-existing-resource';

      const resourceExists = await s3Service.blobExists({
        bucketName,
        blobName: nonExistingResourceName,
      });

      expect(resourceExists).toBe(false);
    });

    it('returns true - when resource exists', async () => {
      await s3TestUtils.uploadObject(bucketName, blobName, path.join(resourcesDirectory, sampleFileName));

      const resourceExists = await s3Service.blobExists({
        bucketName,
        blobName,
      });

      expect(resourceExists).toBe(true);
    });
  });

  describe('delete', () => {
    it('throws an error - when bucket does not exist', async () => {
      const nonExistingBucketName = 'non-existing-bucket';

      try {
        await s3Service.deleteBlob({
          bucketName: nonExistingBucketName,
          blobName,
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('throws an error - when resource does not exist', async () => {
      const nonExistingResourceName = 'non-existing-resource';

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
      await s3TestUtils.uploadObject(bucketName, blobName, path.join(resourcesDirectory, sampleFileName));

      const existsBefore = await s3TestUtils.objectExists(bucketName, blobName);

      expect(existsBefore).toBe(true);

      await s3Service.deleteBlob({
        bucketName,
        blobName,
      });

      const existsAfter = await s3TestUtils.objectExists(bucketName, blobName);

      expect(existsAfter).toBe(false);
    });
  });

  describe('upload', () => {
    it('throws an error - when bucket does not exist', async () => {
      const filePath = path.join(resourcesDirectory, sampleFileName);

      const nonExistingBucketName = 'non-existing-bucket';

      try {
        await s3Service.uploadBlob({
          bucketName: nonExistingBucketName,
          blobName,
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
      const filePath = path.join(resourcesDirectory, sampleFileName);

      await s3Service.uploadBlob({
        bucketName,
        blobName,
        data: createReadStream(filePath),
        contentType: 'image/jpg',
      });

      const exists = await s3TestUtils.objectExists(bucketName, blobName);

      expect(exists).toBe(true);
    });
  });

  describe('getBlobUrl', () => {
    it('throws an error - when bucket does not exist', async () => {
      const nonExistingBucketName = 'non-existing-bucket';

      try {
        await s3Service.getBlobSignedUrl({
          bucketName: nonExistingBucketName,
          blobName,
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('throws an error - when resource does not exist', async () => {
      const nonExistingResourceName = 'non-existing-resource';

      try {
        await s3Service.getBlobSignedUrl({
          bucketName,
          blobName: nonExistingResourceName,
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('returns a signed URL', async () => {
      await s3TestUtils.uploadObject(bucketName, blobName, path.join(resourcesDirectory, sampleFileName));

      const url = await s3Service.getBlobSignedUrl({
        bucketName,
        blobName,
      });

      expect(url).toBeDefined();
    });
  });

  describe('getBlobsUrls', () => {
    it('throws an error - when bucket does not exist', async () => {
      const nonExistingBucketName = 'non-existing-bucket';

      try {
        await s3Service.getBlobs({
          bucketName: nonExistingBucketName,
          prefix: 'prefix',
        });
      } catch (error) {
        expect(error).toBeDefined();

        return;
      }

      expect.fail();
    });

    it('returns URLs for resources', async () => {
      const filePath = path.join(resourcesDirectory, sampleFileName);

      await s3Service.uploadBlob({
        bucketName,
        blobName: `${blobName}/1`,
        data: createReadStream(filePath),
        contentType: 'image/jpg',
      });

      await s3Service.uploadBlob({
        bucketName,
        blobName: `${blobName}/2`,
        data: createReadStream(filePath),
        contentType: 'image/jpg',
      });

      const { blobs } = await s3Service.getBlobs({
        bucketName,
        prefix: blobName,
      });

      expect(blobs.length).toBe(2);

      blobs.forEach((blob) => {
        expect(blob.name.startsWith(blobName)).toBe(true);

        expect(blob.name.endsWith('1') || blob.name.endsWith('2')).toBe(true);

        expect(blob.contentType).toBe('image/jpg');
      });
    });
  });
});
