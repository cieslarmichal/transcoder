import { type HttpRequest } from './httpRequest.js';
import { type HttpResponse } from './httpResponse.js';

export type HttpRouteHandler = (request: HttpRequest) => Promise<HttpResponse>;
