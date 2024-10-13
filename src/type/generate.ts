import { BinaryLike } from 'crypto';

export interface File {
  mimeType: string;
  buffer: { type: string; data: any };
  originalname: string;
  fieldName: string;
  encoding: string;
  size: number;
}
