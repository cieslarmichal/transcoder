/* eslint-disable @typescript-eslint/naming-convention */

export enum EncodingId {
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

export function isTranscodingEncodingId(encodingId: EncodingId): boolean {
  return [EncodingId['360p'], EncodingId['480p'], EncodingId['720p'], EncodingId['1080p']].includes(encodingId);
}

export function isPreviewEncodingId(encodingId: EncodingId): boolean {
  return [
    EncodingId['preview'],
    EncodingId['preview_360p'],
    EncodingId['preview_480p'],
    EncodingId['preview_720p'],
    EncodingId['preview_1080p'],
  ].includes(encodingId);
}

export function isThumbnailEncodingId(encodingId: EncodingId): boolean {
  return encodingId === EncodingId.thumbnail;
}
