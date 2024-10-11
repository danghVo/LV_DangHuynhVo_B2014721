import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { File } from "buffer";

export class AwsService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
      },
    });
  }

  async getImage(uuid: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: "supedu",
        Key: uuid,
      });

      const url = await getSignedUrl(this.s3, command);

      return url;
    } catch (error) {
      console.log(error);
      throw new Error("Có lỗi xảy ra khi lấy ảnh");
    }
  }

  async uploadImage(userUuid: string, image: any) {
    const key = `images/${userUuid}/${image.originalname}`;

    const uploadParams = {
      Bucket: "supedu",
      Key: key,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));

      return key;
    } catch (error) {
      console.log(error);
      throw new Error("Có lỗi xảy ra khi upload ảnh");
    }
  }

  async uploadAvatar(userUuid: string, image: any) {
    const key = `avatars/${userUuid}`;

    const uploadParams = {
      Bucket: "supedu",
      Key: key,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));

      return key;
    } catch (error) {
      console.log(error);
      throw new Error("Có lỗi xảy ra khi upload ảnh đại diện");
    }
  }

  async getFiles<T extends { uuid: string; path?: string }>(files: T[]) {
    const fileWithUrl: T[] = [];
    try {
      for await (const file of files) {
        const command = new GetObjectCommand({
          Bucket: "supedu",
          Key: file.uuid,
        });

        file.path = await getSignedUrl(this.s3, command);

        fileWithUrl.push(file);
      }

      return fileWithUrl;
    } catch (error) {
      console.log(error);
      throw new Error("Có lỗi xảy ra khi lấy file");
    }
  }

  async uploadFile(userUuid: string, file: File) {
    const key = `files/${userUuid}/${file.name}`;

    const buffer = await file.bytes();

    const uploadParams = {
      Bucket: "supedu",
      Key: key,
      Body: buffer,
    };

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));

      return key;
    } catch (error) {
      console.log(error);
      throw new Error("Có lỗi xảy ra khi upload file");
    }
  }

  async deleteFiles(fileKey: Array<string>) {
    for await (const key of fileKey) {
      const command = new DeleteObjectCommand({
        Bucket: "supedu",
        Key: key,
      });

      await this.s3.send(command);
    }
  }
}
