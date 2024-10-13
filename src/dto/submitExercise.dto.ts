import { IsOptional, IsString } from 'class-validator';

export class SubmitExerciseDto {
  @IsString()
  fromUserUuid: string;

  @IsString()
  postUuid: string;

  @IsString()
  assignUuid: string;

  @IsOptional()
  timeAssign: string;

  @IsOptional()
  hashFiles: string;
}
