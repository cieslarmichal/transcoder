import { type S3Client } from '@aws-sdk/client-s3';

import { testSymbols } from './symbols.js';
import { Application } from '../src/core/application.js';
import { coreSymbols } from '../src/core/symbols.js';
import { type DependencyInjectionContainer } from '../src/libs/dependencyInjection/dependencyInjectionContainer.js';
import { S3TestUtils } from '../src/libs/s3/tests/s3TestUtils.js';
import { type SendGridService } from '../src/libs/sendGrid/services/sendGridService/sendGridService.js';

export class TestContainer {
  public static create(): DependencyInjectionContainer {
    const container = Application.createContainer();

    container.overrideBinding<SendGridService>(coreSymbols.sendGridService, () => ({
      sendEmail: async (): Promise<void> => {},
    }));

    container.bind<S3TestUtils>(
      testSymbols.s3TestUtils,
      () => new S3TestUtils(container.get<S3Client>(coreSymbols.s3Client)),
    );

    return container;
  }
}
