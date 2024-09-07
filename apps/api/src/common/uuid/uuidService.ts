import { randomUUID } from 'node:crypto';

export class UuidService {
  public generateUuid(): string {
    return randomUUID();
  }
}
