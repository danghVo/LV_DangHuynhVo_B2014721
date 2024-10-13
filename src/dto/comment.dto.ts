import { IsObject, IsString } from 'class-validator';

export class CommentDto {
  @IsString()
  content: string;

  @IsObject()
  createIn: { time: string; date: string };
}
