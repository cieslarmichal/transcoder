import { type Static, Type } from '@sinclair/typebox';
import { uuidPattern } from './validationPatterns.js';
import { EncodingId } from './encodingId.js';

export const videoArtifactsUploadedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  encodingId: Type.Enum(EncodingId),
});

export type VideoArtifactsUploadedMessage = Static<typeof videoArtifactsUploadedMessageSchema>;
