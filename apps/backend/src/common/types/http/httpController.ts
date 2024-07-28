import { type HttpRoute } from './httpRoute.js';

export abstract class HttpController {
  public abstract readonly basePath: string;
  public abstract readonly tags: string[];

  public abstract getHttpRoutes(): HttpRoute[];
}
