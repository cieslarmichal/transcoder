import { type Static, Type } from '@sinclair/typebox';
import { uuidPattern } from './validationPatterns.js';
import { EncodingId } from './encodingId.js';
import { EncodingContainer, VideoContainer } from './encodingContainer.js';

export const videoEncodingRequestedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  videoContainer: Type.Enum(VideoContainer),
  location: Type.String(),
  encoding: Type.Object({
    id: Type.Enum(EncodingId),
    container: Type.Enum(EncodingContainer),
    width: Type.Integer({ minimum: 1 }),
    height: Type.Integer({ minimum: 1 }),
    bitrate: Type.Optional(Type.Integer({ minimum: 1 })),
    fps: Type.Optional(Type.Integer({ minimum: 1 })),
  }),
});

export type VideoEncodingRequestedMessage = Static<typeof videoEncodingRequestedMessageSchema>;

export type EncodingSpecification = VideoEncodingRequestedMessage['encoding'];
