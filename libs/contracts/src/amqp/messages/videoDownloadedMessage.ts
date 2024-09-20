import { type Static, Type } from '@sinclair/typebox';
import { pathPattern, uuidPattern } from './validationPatterns.js';
import { VideoContainer } from './encodingContainer.js';

export const videoDownloadedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  location: Type.String({ pattern: pathPattern }),
  videoContainer: Type.Enum(VideoContainer),
});

export type VideoDownloadedMessage = Static<typeof videoDownloadedMessageSchema>;
