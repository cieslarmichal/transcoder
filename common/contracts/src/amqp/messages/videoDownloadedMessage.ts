import { type Static, Type } from '@sinclair/typebox';

export const videoDownloadedMessageSchema = Type.Object({
  videoId: Type.String({ format: 'uuid' }),
  location: Type.String({ minLength: 1 }),
});

export type VideoDownloadedMessage = Static<typeof videoDownloadedMessageSchema>;
