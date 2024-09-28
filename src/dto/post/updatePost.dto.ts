import { IsOptional } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  title: string;

  @IsOptional()
  content: string;

  @IsOptional()
  files: any;

  @IsOptional()
  voteData: string | null;

  @IsOptional()
  timeTaskEnd: string;

  @IsOptional()
  filesUpdate: string;

  @IsOptional()
  hashFiles: string;
}
