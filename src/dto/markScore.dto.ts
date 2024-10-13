import { Option } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class MarkScoreDto {
  @IsString()
  submitUuid: string;

  @IsString()
  score: string;

  @IsOptional()
  feedback: string;
}
