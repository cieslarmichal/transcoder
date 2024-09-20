/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AttachedFile {
  readonly name: string;
  readonly filePath: string;
}

export interface HttpRequest<Body = any, QueryParams = any, PathParams = any> {
  readonly body: Body;
  readonly pathParams: PathParams;
  readonly queryParams: QueryParams;
  readonly headers: Record<string, string>;
  readonly files?: AttachedFile[] | undefined;
}
