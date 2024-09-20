import { type Static, Type } from '@sinclair/typebox';
import { pathPattern, uuidPattern } from './validationPatterns.js';
import { EncodingId } from './encodingId.js';

export const videoEncodedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  artifactsDirectory: Type.String({ pattern: pathPattern }),
  encodingId: Type.Enum(EncodingId),
});

export type VideoEncodedMessage = Static<typeof videoEncodedMessageSchema>;
