import { ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AwsService } from './aws.service';
import { File } from '../type/generate';
import { File as FileS3 } from 'buffer';
import { decode7bit } from './decode7bit';

export default async function saveFiles(
  aws: AwsService,
  filesHashed: string,
  files: File[],
  uuid: string,
): Promise<{ uuid: string; name: string; extension: string }[]> {
  let filesSave = [];

  for (const file of files) {
    let buffer = Buffer.from(file.buffer.data);
    if (file.encoding == '7bit') {
      buffer = decode7bit(buffer);
    }

    const fileObject = new FileS3([buffer], file.originalname);

    const key = await aws.uploadFile(uuid, fileObject);

    const fileSave = {
      uuid: key,
      name: file.originalname,
      extension: file.originalname.split('.').pop(),
    };

    filesSave.push(fileSave);
  }

  return filesSave;
}
