import { type Static, Type } from '@sinclair/typebox';
import { urlPattern, uuidPattern } from './validationPatterns.js';

export const videoIngestedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  videoUrl: Type.String({ pattern: urlPattern }),
});

export type VideoIngestedMessage = Static<typeof videoIngestedMessageSchema>;
