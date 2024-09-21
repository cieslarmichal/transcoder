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
  'thumbnails' = 'thumbnails',
}

export function isFullVideoFormat(encodingId: EncodingId): boolean {
  return [EncodingId['360p'], EncodingId['480p'], EncodingId['720p'], EncodingId['1080p']].includes(encodingId);
}

export function isPreviewFormat(encodingId: EncodingId): boolean {
  return [
    EncodingId['preview'],
    EncodingId['preview_360p'],
    EncodingId['preview_480p'],
    EncodingId['preview_720p'],
    EncodingId['preview_1080p'],
  ].includes(encodingId);
}

export function isThumbnailsFormat(encodingId: EncodingId): boolean {
  return encodingId === EncodingId.thumbnails;
}
