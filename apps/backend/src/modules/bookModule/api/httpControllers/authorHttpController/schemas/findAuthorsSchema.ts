import { type Static, Type } from '@sinclair/typebox';

import type * as contracts from '@common/contracts';

import { type TypeExtends } from '../../../../../../common/types/schemaExtends.js';
import { authorDtoSchema } from './authorDto.js';

export const findAuthorsQueryParamsDtoSchema = Type.Object({
  name: Type.Optional(
    Type.String({
      minLength: 1,
      maxLength: 128,
    }),
  ),
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1 })),
});

export type FindAuthorsQueryParamsDto = TypeExtends<
  Static<typeof findAuthorsQueryParamsDtoSchema>,
  contracts.FindAuthorsQueryParams
>;

export const findAuthorsResponseBodyDtoSchema = Type.Object({
  data: Type.Array(authorDtoSchema),
  metadata: Type.Object({
    page: Type.Integer({ minimum: 1 }),
    pageSize: Type.Integer({ minimum: 1 }),
    total: Type.Integer({ minimum: 0 }),
  }),
});

export type FindAuthorsResponseBodyDto = TypeExtends<
  Static<typeof findAuthorsResponseBodyDtoSchema>,
  contracts.FindAuthorsResponseBody
>;
