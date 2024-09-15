/* eslint-disable @typescript-eslint/naming-convention */

import { type Static, Type } from '@sinclair/typebox';
import { pathPattern, uuidPattern } from './validationPatterns.js';

export enum EncodingProfile {
  '360p' = '360p',
  '480p' = '480p',
  '720p' = '720p',
  '1080p' = '1080p',
  'preview' = 'preview',
  'preview_360p' = 'preview_360p',
  'preview_480p' = 'preview_480p',
  'preview_720p' = 'preview_720p',
  'preview_1080p' = 'preview_1080p',
  'thumbnail' = 'thumbnail',
}

export const videoEncodingRequestedMessageSchema = Type.Object({
  videoId: Type.String({ pattern: uuidPattern }),
  location: Type.String({ pattern: pathPattern }),
  encodingProfile: Type.Object({
    id: Type.Enum(EncodingProfile),
    width: Type.Integer({ minimum: 1 }),
    height: Type.Integer({ minimum: 1 }),
    bitrate: Type.Integer({ minimum: 1 }),
    fps: Type.Integer({ minimum: 1 }),
  }),
});

export type VideoEncodingRequestedMessage = Static<typeof videoEncodingRequestedMessageSchema>;
