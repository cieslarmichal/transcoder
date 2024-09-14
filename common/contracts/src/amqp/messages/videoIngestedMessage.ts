import { type Static, Type } from '@sinclair/typebox';

export const videoIngestedMessageSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
  downloadUrl: Type.String({ minLength: 1 }),
  userEmail: Type.String({ minLength: 1 }),
});

export type VideoIngestedMessage = Static<typeof videoIngestedMessageSchema>;
