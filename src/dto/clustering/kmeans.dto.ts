import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class KmeansDto {
  @IsNotEmpty()
  cluster: number;

  @IsNotEmpty()
  iteration: number;

  @IsNotEmpty()
  @IsEnum(['euclidean', 'manhattan'])
  distanceType: string;

  @IsOptional()
  initCentroidLine: string[];
}
