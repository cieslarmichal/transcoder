/* eslint-disable @typescript-eslint/naming-convention */

export enum VideoContainer {
  mp4 = 'mp4',
  mov = 'mov',
  avi = 'avi',
  mkv = 'mkv',
  wmv = 'wmv',
  flv = 'flv',
  webm = 'webm',
  mpeg = 'mpeg',
  mpg = 'mpg',
  '3gp' = '3gp',
  ogg = 'ogg',
  ts = 'ts',
  m4v = 'm4v',
  m2ts = 'm2ts',
  vob = 'vob',
  rm = 'rm',
  rmvb = 'rmvb',
  divx = 'divx',
  asf = 'asf',
  swf = 'swf',
  f4v = 'f4v',
}

export enum EncodingContainer {
  mp4 = 'mp4',
  mov = 'mov',
  avi = 'avi',
  mkv = 'mkv',
  wmv = 'wmv',
  flv = 'flv',
  webm = 'webm',
  mpeg = 'mpeg',
  mpg = 'mpg',
  '3gp' = '3gp',
  ogg = 'ogg',
  ts = 'ts',
  m4v = 'm4v',
  m2ts = 'm2ts',
  vob = 'vob',
  rm = 'rm',
  rmvb = 'rmvb',
  divx = 'divx',
  asf = 'asf',
  swf = 'swf',
  f4v = 'f4v',
  jpeg = 'jpeg',
  jpg = 'jpg',
  png = 'png',
  gif = 'gif',
}

export function isVideoContainer(container: string): container is VideoContainer {
  return Object.values(VideoContainer).includes(container as VideoContainer);
}

export function mapVideoContainerToContentType(container: VideoContainer): string {
  const videoContainerToContentTypeMapping: Record<VideoContainer, string> = {
    [VideoContainer.mp4]: 'video/mp4',
    [VideoContainer.mov]: 'video/quicktime',
    [VideoContainer.avi]: 'video/x-msvideo',
    [VideoContainer.mkv]: 'video/x-matroska',
    [VideoContainer.wmv]: 'video/x-ms-wmv',
    [VideoContainer.flv]: 'video/x-flv',
    [VideoContainer.webm]: 'video/webm',
    [VideoContainer.mpeg]: 'video/mpeg',
    [VideoContainer.mpg]: 'video/mpeg',
    [VideoContainer['3gp']]: 'video/3gpp',
    [VideoContainer.ogg]: 'video/ogg',
    [VideoContainer.ts]: 'video/mp2t',
    [VideoContainer.m4v]: 'video/x-m4v',
    [VideoContainer.m2ts]: 'video/MP2T',
    [VideoContainer.vob]: 'video/dvd',
    [VideoContainer.rm]: 'application/vnd.rn-realmedia',
    [VideoContainer.rmvb]: 'application/vnd.rn-realmedia-vbr',
    [VideoContainer.divx]: 'video/divx',
    [VideoContainer.asf]: 'video/x-ms-asf',
    [VideoContainer.swf]: 'application/x-shockwave-flash',
    [VideoContainer.f4v]: 'video/x-f4v',
  };

  return videoContainerToContentTypeMapping[container];
}
