import { IsEnum, IsNotEmpty } from "class-validator";

export class HierarchicalDto {
    @IsNotEmpty()
    @IsEnum(["single", "complete", "average"])
    linkedMethod: string;

    @IsNotEmpty()
    @IsEnum(["euclidean", "manhattan"])
    distanceType: string;

    @IsNotEmpty()
    csvFile: File;
}   