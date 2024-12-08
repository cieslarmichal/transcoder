import { type Static, Type } from '@sinclair/typebox';

import { VideoContainer } from './encodingContainer.js';
import { urlPattern, uuidPattern } from './validationPatterns.js';

export const videoIngestedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  videoUrl: Type.String({ pattern: urlPattern }),
  videoContainer: Type.Enum(VideoContainer),
});

export type VideoIngestedMessage = Static<typeof videoIngestedMessageSchema>;
