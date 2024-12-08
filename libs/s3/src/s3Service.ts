/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
  type S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type Readable } from 'node:stream';

import { OperationNotValidError } from '@libs/errors';

export interface UploadBlobPayload {
  readonly blobName: string;
  readonly bucketName: string;
  readonly data: Readable;
  readonly contentType: string;
  readonly attachmentName?: string;
}

export interface UploadBlobResult {
  readonly location: string;
}

export interface GetBlobSignedUrlPayload {
  readonly blobName: string;
  readonly bucketName: string;
}

export interface GetBlobsPayload {
  readonly prefix: string;
  readonly bucketName: string;
}

export interface GetBlobsResult {
  readonly blobs: { name: string; contentType: string }[];
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
    const { bucketName, blobName, data, contentType, attachmentName } = payload;

    const putObjectInput: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: blobName,
      Body: data,
      ContentType: contentType,
      ACL: 'public-read',
    };

    if (attachmentName) {
      putObjectInput.ContentDisposition = `attachment; filename=${attachmentName}`;
    }

    const upload = new Upload({
      client: this.s3Client,
      params: putObjectInput,
    });

    const { Location } = await upload.done();

    return { location: Location as string };
  }

  public async getBlobSignedUrl(payload: GetBlobSignedUrlPayload): Promise<string> {
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

  public async getBlobs(payload: GetBlobsPayload): Promise<GetBlobsResult> {
    const { prefix, bucketName } = payload;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const result = await this.s3Client.send(command);

    if (!result.Contents) {
      return { blobs: [] };
    }

    const blobs = await Promise.all(
      result.Contents.map(async (data) => {
        const name = data.Key as string;

        const metadata = await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: name,
          }),
        );

        return { name, contentType: metadata.ContentType as string };
      }),
    );

    return { blobs };
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
