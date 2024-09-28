import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsOptional()
  content: string;

  @IsEnum(['Announcement', 'Exercise', 'Vote'])
  type: 'Announcement' | 'Exercise' | 'Vote';

  @IsOptional()
  files: any;

  @IsOptional()
  voteData: string | null;

  @IsOptional()
  timeTaskEnd: string;

  @IsOptional()
  hashFiles: string;
}
