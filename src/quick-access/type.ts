import { IsNotEmpty, IsString } from "class-validator";

export class QuickAccessDto {
    @IsNotEmpty()
    @IsString()
    title : string
    
    @IsNotEmpty()
    @IsString()
    link : string
    
    @IsNotEmpty()
    @IsString()
    fileId : string
}