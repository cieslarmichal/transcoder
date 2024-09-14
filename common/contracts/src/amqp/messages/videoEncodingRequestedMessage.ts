/* eslint-disable @typescript-eslint/naming-convention */

import { type Static, Type } from '@sinclair/typebox';

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
  videoId: Type.String({ format: 'uuid' }),
  location: Type.String({ minLength: 1 }),
  encodingProfile: Type.Object({
    id: Type.Enum(EncodingProfile),
    width: Type.Integer(),
    height: Type.Integer(),
    bitrate: Type.Integer(),
    fps: Type.Integer(),
  }),
});

export type VideoEncodingRequestedMessage = Static<typeof videoEncodingRequestedMessageSchema>;
