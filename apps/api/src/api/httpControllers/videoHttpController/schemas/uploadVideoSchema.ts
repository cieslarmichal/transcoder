import { type Static, Type } from '@sinclair/typebox';

export const uploadVideoQueryParamsDtoSchema = Type.Object({
  notificationEmail: Type.String({
    minLength: 1,
    maxLength: 128,
  }),
});

export type UploadVideoQueryParamsDto = Static<typeof uploadVideoQueryParamsDtoSchema>;

export const uploadVideoResponseBodyDtoSchema = Type.Object({
  traceId: Type.String({ format: 'uuid' }),
});

export type UploadVideoResponseBodyDto = Static<typeof uploadVideoResponseBodyDtoSchema>;
