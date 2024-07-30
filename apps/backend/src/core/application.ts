import { ApplicationHttpController } from './api/httpControllers/applicationHttpController/applicationHttpController.js';
import { type Config, ConfigFactory } from './config.js';
import { HttpServer } from './httpServer.js';

export class Application {
  public static createContainer(): DependencyInjectionContainer {
    const modules: DependencyInjectionModule[] = [new BookModule()];

    const container = DependencyInjectionContainerFactory.create({ modules });

    const config = ConfigFactory.create();

    container.bind<LoggerService>(symbols.logger, () => LoggerServiceFactory.create({ logLevel: config.logLevel }));

    container.bind<HttpService>(symbols.httpService, () =>
      new HttpServiceFactory(container.get<LoggerService>(symbols.logger)).create(),
    );

    container.bind<UuidService>(symbols.uuidService, () => new UuidServiceImpl());

    container.bind<Config>(symbols.config, () => config);

    container.bind<ApplicationHttpController>(symbols.applicationHttpController, () => new ApplicationHttpController());

    const s3Config: S3Config = {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
      endpoint: config.aws.endpoint ?? undefined,
    };

    container.bind<S3Client>(symbols.s3Client, () => S3ClientFactory.create(s3Config));

    container.bind<S3Service>(symbols.s3Service, () => new S3Service(container.get<S3Client>(coreSymbols.s3Client)));

    return container;
  }

  public static async start(): Promise<void> {
    const container = Application.createContainer();

    const server = new HttpServer(container);

    await server.start();
  }
}
