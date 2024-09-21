import { type Static, Type } from '@sinclair/typebox';

export const getVideoEncodingArtifactsPathParamsDtoSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
});

export type GetVideoEncodingArtifactsPathParamsDto = Static<typeof getVideoEncodingArtifactsPathParamsDtoSchema>;

export const getVideoEncodingArtifactsResponseBodyDtoSchema = Type.Object({
  data: Type.Array(
    Type.Object({
      name: Type.String(),
      url: Type.String(),
      contentType: Type.String(),
    }),
  ),
});

export type GetVideoEncodingArtifactsResponseBodyDto = Static<typeof getVideoEncodingArtifactsResponseBodyDtoSchema>;
