import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  userUuid: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsString()
  theme: string;

  @IsOptional()
  requireApprove: string;

  @IsString()
  textColor: string;
}
