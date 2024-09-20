import { type Static, Type } from '@sinclair/typebox';

export const uploadVideoResponseBodyDtoSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
  videoUrl: Type.String({ minLength: 1 }),
});

export type UploadVideoResponseBodyDto = Static<typeof uploadVideoResponseBodyDtoSchema>;
