import { type Static, Type } from '@sinclair/typebox';

export const authorDtoSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({
    minLength: 1,
    maxLength: 128,
  }),
  isApproved: Type.Boolean(),
});

export type AuthorDto = Static<typeof authorDtoSchema>;
