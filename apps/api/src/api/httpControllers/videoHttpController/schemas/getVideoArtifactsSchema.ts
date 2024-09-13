import { type Static, Type } from '@sinclair/typebox';

export const getVideoArtifactsPathParamsDtoSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
});

export type GetVideoArtifactsPathParamsDto = Static<typeof getVideoArtifactsPathParamsDtoSchema>;

export const getVideoArtifactsResponseBodyDtoSchema = Type.Object({
  data: Type.Array(
    Type.Object({
      id: Type.String(),
      url: Type.String(),
    }),
  ),
});

export type GetVideoArtifactsResponseBodyDto = Static<typeof getVideoArtifactsResponseBodyDtoSchema>;
