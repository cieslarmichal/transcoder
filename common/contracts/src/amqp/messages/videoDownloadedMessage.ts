import { type Static, Type } from '@sinclair/typebox';
import { pathPattern, uuidPattern } from './validationPatterns.js';

export const videoDownloadedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  location: Type.String({ pattern: pathPattern }),
});

export type VideoDownloadedMessage = Static<typeof videoDownloadedMessageSchema>;
