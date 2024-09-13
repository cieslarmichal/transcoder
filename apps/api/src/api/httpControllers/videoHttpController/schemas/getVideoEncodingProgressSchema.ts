import { type Static, Type } from '@sinclair/typebox';

export const getVideoEncodingProgressPathParamsDtoSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
});

export type GetVideoEncodingProgressPathParamsDto = Static<typeof getVideoEncodingProgressPathParamsDtoSchema>;

export const getVideoEncodingProgressResponseBodyDtoSchema = Type.Object({
  data: Type.Array(
    Type.Object({
      id: Type.String(),
      progress: Type.String(),
    }),
  ),
});

export type GetVideoEncodingProgressResponseBodyDto = Static<typeof getVideoEncodingProgressResponseBodyDtoSchema>;
