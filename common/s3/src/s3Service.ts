/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { type Readable } from 'node:stream';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { OperationNotValidError } from '@common/errors';

export interface UploadBlobPayload {
  readonly blobName: string;
  readonly sourceName?: string;
  readonly bucketName: string;
  readonly data: Readable;
  readonly contentType: string;
}

export interface GetBlobUrlPayload {
  readonly blobName: string;
  readonly bucketName: string;
}

export interface GetBlobsUrlsPayload {
  readonly prefix: string;
  readonly bucketName: string;
}

export interface BlobExistsPayload {
  readonly blobName: string;
  readonly bucketName: string;
}

export interface DeleteBlobPayload {
  readonly blobName: string;
  readonly bucketName: string;
}

export interface GetBlobNamesPayload {
  readonly bucketName: string;
}

export class S3Service {
  public constructor(private readonly s3Client: S3Client) {}

  public async uploadBlob(payload: UploadBlobPayload): Promise<void> {
    const { bucketName, blobName, data, contentType, sourceName } = payload;

    const attachmentFileName = sourceName ? sourceName : blobName;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucketName,
        Key: blobName,
        Body: data,
        ContentType: contentType,
        ContentDisposition: `attachment; filename=${attachmentFileName}`,
      },
    });

    await upload.done();
  }

  public async getBlobUrl(payload: GetBlobUrlPayload): Promise<string> {
    const { blobName, bucketName } = payload;

    const exists = await this.blobExists({
      blobName,
      bucketName,
    });

    if (!exists) {
      throw new OperationNotValidError({
        reason: 'Resource does not exist in bucket.',
        blobName,
        bucketName,
      });
    }

    const url = await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: blobName,
      }),
      { expiresIn: 86400 },
    );

    return url;
  }

  public async getBlobsUrls(
    payload: GetBlobsUrlsPayload,
  ): Promise<{ name: string; url: string; contentType: string }[]> {
    const { prefix, bucketName } = payload;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const result = await this.s3Client.send(command);

    if (!result.Contents) {
      return [];
    }

    return Promise.all(
      result.Contents.map(async (data) => {
        const name = data.Key as string;

        const [url, metadata] = await Promise.all([
          getSignedUrl(
            this.s3Client,
            new GetObjectCommand({
              Bucket: bucketName,
              Key: name,
            }),
            { expiresIn: 86400 },
          ),
          this.s3Client.send(
            new HeadObjectCommand({
              Bucket: bucketName,
              Key: name,
            }),
          ),
        ]);

        return { name, url, contentType: metadata.ContentType as string };
      }),
    );
  }

  public async blobExists(payload: BlobExistsPayload): Promise<boolean> {
    const { blobName, bucketName } = payload;

    try {
      const resourcesNames = await this.getBlobNames({ bucketName });

      return resourcesNames.includes(blobName);
    } catch (error) {
      return false;
    }
  }

  public async deleteBlob(payload: DeleteBlobPayload): Promise<void> {
    const { blobName, bucketName } = payload;

    const exists = await this.blobExists({
      blobName,
      bucketName,
    });

    if (!exists) {
      throw new OperationNotValidError({
        reason: 'Resource does not exist in bucket.',
        blobName,
        bucketName,
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: blobName,
    });

    await this.s3Client.send(command);
  }

  private async getBlobNames(payload: GetBlobNamesPayload): Promise<string[]> {
    const { bucketName } = payload;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const result = await this.s3Client.send(command);

    if (!result.Contents) {
      return [];
    }

    return result.Contents.map((metadata) => metadata.Key as string);
  }
}
