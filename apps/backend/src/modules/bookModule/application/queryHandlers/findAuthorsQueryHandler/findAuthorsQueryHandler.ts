import { type QueryHandler } from '../../../../../common/types/queryHandler.js';
import { type Author } from '../../../domain/entities/author/author.js';

export interface ExecutePayload {
  readonly name?: string | undefined;
  readonly page: number;
  readonly pageSize: number;
}

export interface ExecuteResult {
  readonly authors: Author[];
  readonly total: number;
}

export type FindAuthorsQueryHandler = QueryHandler<ExecutePayload, ExecuteResult>;
