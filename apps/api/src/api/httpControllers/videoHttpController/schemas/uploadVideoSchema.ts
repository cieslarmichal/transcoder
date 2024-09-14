import { type Static, Type } from '@sinclair/typebox';

export const uploadVideoQueryParamsDtoSchema = Type.Object({
  notificationEmail: Type.String({
    minLength: 1,
    maxLength: 128,
  }),
});

export type UploadVideoQueryParamsDto = Static<typeof uploadVideoQueryParamsDtoSchema>;

export const uploadVideoResponseBodyDtoSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
  downloadUrl: Type.String({ minLength: 1 }),
});

export type UploadVideoResponseBodyDto = Static<typeof uploadVideoResponseBodyDtoSchema>;
