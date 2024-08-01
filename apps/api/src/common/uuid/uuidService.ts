import { v4 as uuidv4 } from 'uuid';

export class UuidService {
  public generateUuid(): string {
    return uuidv4();
  }
}
