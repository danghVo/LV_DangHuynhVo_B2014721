import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateClassDto {
  @IsString()
  userUuid: string;

  @IsString()
  classUuid: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  theme: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  textColor: string;

  @IsOptional()
  @IsBoolean()
  requireApprove: boolean;
}
