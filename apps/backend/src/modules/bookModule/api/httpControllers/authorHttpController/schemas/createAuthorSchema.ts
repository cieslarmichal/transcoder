import { type Static, Type } from '@sinclair/typebox';

import type * as contracts from '@common/contracts';

import { type TypeExtends } from '../../../../../../common/types/schemaExtends.js';
import { authorDtoSchema } from './authorDto.js';

export const createAuthorBodyDtoSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 128,
  }),
});

export type CreateAuthorBodyDto = TypeExtends<
  Static<typeof createAuthorBodyDtoSchema>,
  contracts.CreateAuthorRequestBody
>;

export const createAuthorResponseBodyDtoSchema = authorDtoSchema;

export type CreateAuthorResponseBodyDto = TypeExtends<
  Static<typeof createAuthorResponseBodyDtoSchema>,
  contracts.CreateAuthorResponseBody
>;
