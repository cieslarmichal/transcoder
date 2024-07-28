import { type Readable } from 'node:stream';

import { type CommandHandler } from '../../../../../common/types/commandHandler.js';
import { type UserBook } from '../../../domain/entities/userBook/userBook.js';

export interface UploadUserBookImageCommandHandlerPayload {
  readonly userBookId: string;
  readonly data: Readable;
  readonly contentType: string;
}

export interface UploadUserBookImageCommandHandlerResult {
  readonly userBook: UserBook;
}

export type UploadUserBookImageCommandHandler = CommandHandler<
  UploadUserBookImageCommandHandlerPayload,
  UploadUserBookImageCommandHandlerResult
>;
