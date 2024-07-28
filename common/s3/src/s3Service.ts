/* eslint-disable @typescript-eslint/naming-convention */

import { DeleteObjectCommand, ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { type Readable } from 'node:stream';

import { OperationNotValidError } from '../../common/errors/operationNotValidError.js';

export interface UploadBlobPayload {
  readonly blobName: string;
  readonly bucketName: string;
  readonly data: Readable;
  readonly contentType: string;
}

export interface UploadBlobResult {
  readonly location: string;
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

  public async uploadBlob(payload: UploadBlobPayload): Promise<UploadBlobResult> {
    const { bucketName, blobName, data, contentType } = payload;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucketName,
        Key: blobName,
        Body: data,
        ContentType: contentType,
      },
    });

    const result = await upload.done();

    return { location: result.Location as string };
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
