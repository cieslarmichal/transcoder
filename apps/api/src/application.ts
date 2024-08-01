import { LoggerFactory } from '@common/logger';
import { S3ClientFactory, type S3Config, S3Service } from '@common/s3';

import { UploadVideoAction } from './actions/uploadVideoAction/uploadVideoAction.js';
import { ApplicationHttpController } from './api/httpControllers/applicationHttpController/applicationHttpController.js';
import { VideoHttpController } from './api/httpControllers/videoHttpController/videoHttpController.js';
import { UuidService } from './common/uuid/uuidService.js';
import { ConfigFactory } from './config.js';
import { HttpServer } from './httpServer.js';

export class Application {
  public async start(): Promise<void> {
    const config = ConfigFactory.create();

    const logger = LoggerFactory.create({
      appName: config.appName,
      logLevel: config.logLevel,
    });

    const uuidService = new UuidService();

    const s3Config: S3Config = {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
      endpoint: config.aws.endpoint ?? undefined,
    };

    const s3Service = new S3Service(S3ClientFactory.create(s3Config));

    const applicationHttpController = new ApplicationHttpController();

    const uploadVideoAction = new UploadVideoAction(s3Service, uuidService, config, logger);

    const videoHttpController = new VideoHttpController(uploadVideoAction);

    const server = new HttpServer([applicationHttpController, videoHttpController], logger, config);

    await server.start();
  }
}
