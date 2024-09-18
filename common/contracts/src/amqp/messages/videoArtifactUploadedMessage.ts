import { type Static, Type } from '@sinclair/typebox';
import { urlPattern, uuidPattern } from './validationPatterns.js';
import { EncodingId } from './encodingId.js';

export const videoArtifactUploadedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  encodingId: Type.Enum(EncodingId),
  videoArtifactUrl: Type.String({ pattern: urlPattern }),
});

export type VideoArtifactUploadedMessage = Static<typeof videoArtifactUploadedMessageSchema>;
