import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum priorityDto {
    HIGH = "HIGH",
    LOW = "LOW",
    MEDIUM = "MEDIUM"
}

export class createBookMarkDto  {
    @IsNotEmpty()
    @IsString()
    title : string
    
    @IsOptional()
    @IsString()
    priority : string
    
    @IsOptional()
    @IsArray()
    hashTags : string[]

    @IsNotEmpty()
    @IsString()
    fileId : string
    
    @IsNotEmpty()
    @IsString()
    description : string
}