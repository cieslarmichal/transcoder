import { createReadStream } from 'node:fs';
import path from 'path';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { type UploadUserBookImageCommandHandler } from './uploadUserBookImageCommandHandler.js';
import { Generator } from '../../../../../../tests/generator.js';
import { testSymbols } from '../../../../../../tests/symbols.js';
import { TestContainer } from '../../../../../../tests/testContainer.js';
import { type TestUtils } from '../../../../../../tests/testUtils.js';
import { OperationNotValidError } from '../../../../../common/errors/operationNotValidError.js';
import { type Config } from '../../../../../core/config.js';
import { coreSymbols } from '../../../../../core/symbols.js';
import { type DatabaseClient } from '../../../../../libs/database/clients/databaseClient/databaseClient.js';
import { type DependencyInjectionContainer } from '../../../../../libs/dependencyInjection/dependencyInjectionContainer.js';
import { type S3TestUtils } from '../../../../../libs/s3/tests/s3TestUtils.js';
import { type UuidService } from '../../../../../libs/uuid/uuidService.js';
import { type BookshelfTestUtils } from '../../../../bookshelfModule/tests/utils/bookshelfTestUtils/bookshelfTestUtils.js';
import { type UserTestUtils } from '../../../../userModule/tests/utils/userTestUtils/userTestUtils.js';
import { symbols } from '../../../symbols.js';
import { type AuthorTestUtils } from '../../../tests/utils/authorTestUtils/authorTestUtils.js';
import { type BookTestUtils } from '../../../tests/utils/bookTestUtils/bookTestUtils.js';
import { type UserBookTestUtils } from '../../../tests/utils/userBookTestUtils/userBookTestUtils.js';

describe('UploadUserBookImageCommandHandlerImpl', () => {
  let commandHandler: UploadUserBookImageCommandHandler;

  let s3TestUtils: S3TestUtils;

  let container: DependencyInjectionContainer;

  let userTestUtils: UserTestUtils;

  let bookTestUtils: BookTestUtils;

  let bookshelfTestUtils: BookshelfTestUtils;

  let authorTestUtils: AuthorTestUtils;

  let userBookTestUtils: UserBookTestUtils;

  let databaseClient: DatabaseClient;

  let config: Config;

  let testUtils: TestUtils[];

  const resourcesDirectory = path.resolve(__dirname, '../../../../../../../../resources');

  const sampleFileName = 'book1.jpg';

  const bucketName = 'misyma-images';

  const filePath = path.join(resourcesDirectory, sampleFileName);

  const imageId = Generator.uuid();

  beforeEach(async () => {
    container = TestContainer.create();

    container.overrideBinding<UuidService>(coreSymbols.uuidService, () => ({
      generateUuid: (): string => imageId,
    }));

    commandHandler = container.get<UploadUserBookImageCommandHandler>(symbols.uploadUserBookImageCommandHandler);

    userTestUtils = container.get<UserTestUtils>(testSymbols.userTestUtils);

    s3TestUtils = container.get<S3TestUtils>(testSymbols.s3TestUtils);

    databaseClient = container.get<DatabaseClient>(coreSymbols.databaseClient);

    bookTestUtils = container.get<BookTestUtils>(testSymbols.bookTestUtils);

    bookshelfTestUtils = container.get<BookshelfTestUtils>(testSymbols.bookshelfTestUtils);

    authorTestUtils = container.get<AuthorTestUtils>(testSymbols.authorTestUtils);

    userTestUtils = container.get<UserTestUtils>(testSymbols.userTestUtils);

    userBookTestUtils = container.get<UserBookTestUtils>(testSymbols.userBookTestUtils);

    config = container.get<Config>(coreSymbols.config);

    testUtils = [authorTestUtils, bookTestUtils, bookshelfTestUtils, userTestUtils, userBookTestUtils];

    for (const testUtil of testUtils) {
      await testUtil.truncate();
    }

    await s3TestUtils.createBucket(bucketName);
  });

  afterEach(async () => {
    for (const testUtil of testUtils) {
      await testUtil.truncate();
    }

    await databaseClient.destroy();

    await s3TestUtils.deleteBucket(bucketName);
  });

  it('throws an error - when UserBook does not exist', async () => {
    const userBookId = Generator.uuid();

    try {
      await commandHandler.execute({
        userBookId,
        contentType: 'image/jpg',
        data: createReadStream(filePath),
      });
    } catch (error) {
      expect(error).toBeInstanceOf(OperationNotValidError);

      return;
    }

    expect.fail();
  });

  it('uploads an image', async () => {
    const user = await userTestUtils.createAndPersist();

    const author = await authorTestUtils.createAndPersist();

    const bookshelf = await bookshelfTestUtils.createAndPersist({
      input: {
        userId: user.id,
      },
    });

    const book = await bookTestUtils.createAndPersist({
      input: {
        authorIds: [author.id],
      },
    });

    const userBook = await userBookTestUtils.createAndPersist({
      input: {
        bookId: book.id,
        bookshelfId: bookshelf.id,
      },
    });

    const existsBefore = await s3TestUtils.objectExists(bucketName, sampleFileName);

    expect(existsBefore).toBe(false);

    const { userBook: updatedUserBook } = await commandHandler.execute({
      userBookId: userBook.id,
      data: createReadStream(filePath),
      contentType: 'image/jpg',
    });

    expect(updatedUserBook.getImageUrl()).toEqual(`${config.aws.cloudfrontUrl}/${imageId}`);

    const foundUserBook = await userBookTestUtils.findById({ id: userBook.id });

    expect(foundUserBook?.imageUrl).toEqual(`${config.aws.cloudfrontUrl}/${imageId}`);

    const existsAfter = await s3TestUtils.objectExists(bucketName, imageId);

    expect(existsAfter).toBe(true);
  });

  it('uploads an image when UserBook already has some image', async () => {
    const user = await userTestUtils.createAndPersist();

    const author = await authorTestUtils.createAndPersist();

    const bookshelf = await bookshelfTestUtils.createAndPersist({
      input: {
        userId: user.id,
      },
    });

    const book = await bookTestUtils.createAndPersist({
      input: {
        authorIds: [author.id],
      },
    });

    const existingImageId = Generator.uuid();

    await s3TestUtils.uploadObject(bucketName, existingImageId, filePath);

    const userBook = await userBookTestUtils.createAndPersist({
      input: {
        bookId: book.id,
        bookshelfId: bookshelf.id,
        imageUrl: `${config.aws.cloudfrontUrl}/${existingImageId}`,
      },
    });

    const oldImageExistsBefore = await s3TestUtils.objectExists(bucketName, existingImageId);

    expect(oldImageExistsBefore).toBe(true);

    const newImageExistsBefore = await s3TestUtils.objectExists(bucketName, sampleFileName);

    expect(newImageExistsBefore).toBe(false);

    const { userBook: updatedUserBook } = await commandHandler.execute({
      userBookId: userBook.id,
      data: createReadStream(filePath),
      contentType: 'image/jpg',
    });

    expect(updatedUserBook.getImageUrl()).toEqual(`${config.aws.cloudfrontUrl}/${imageId}`);

    const foundUserBook = await userBookTestUtils.findById({ id: userBook.id });

    expect(foundUserBook?.imageUrl).toEqual(`${config.aws.cloudfrontUrl}/${imageId}`);

    const newImageExistsAfter = await s3TestUtils.objectExists(bucketName, imageId);

    expect(newImageExistsAfter).toBe(true);

    const oldImageExistsAfter = await s3TestUtils.objectExists(bucketName, existingImageId);

    expect(oldImageExistsAfter).toBe(false);
  });
});
