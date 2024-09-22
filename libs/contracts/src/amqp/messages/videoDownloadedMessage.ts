import { type Static, Type } from '@sinclair/typebox';
import { uuidPattern } from './validationPatterns.js';
import { VideoContainer } from './encodingContainer.js';

export const videoDownloadedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  location: Type.String(),
  videoContainer: Type.Enum(VideoContainer),
});

export type VideoDownloadedMessage = Static<typeof videoDownloadedMessageSchema>;
