import { type Static, Type } from '@sinclair/typebox';
import { pathPattern, uuidPattern } from './validationPatterns.js';
import { EncodingId } from './encodingId.js';
import { EncodingContainer } from './encodingContainer.js';

export const videoEncodedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  location: Type.String({ pattern: pathPattern }),
  encoding: Type.Object({
    id: Type.Enum(EncodingId),
    container: Type.Enum(EncodingContainer),
  }),
});

export type VideoEncodedMessage = Static<typeof videoEncodedMessageSchema>;
