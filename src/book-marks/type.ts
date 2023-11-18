import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum priorityDto {
    HIGH = "HIGH",
    LOW = "LOW",
    MEDIUM = "MEDIUM"
}

export class createBookMarkDto  {
    @IsNotEmpty()
    @IsString()
    title : string
    
    @IsNotEmpty()
    @IsString()
    link : string
    
    @IsNotEmpty()
    @IsBoolean()
    pinned : boolean
    
    @IsOptional()
    @IsString()
    priority : string
    
    @IsOptional()
    @IsArray()
    hashTags : string[]

    @IsNotEmpty()
    @IsString()
    fileId : string
    
    @IsOptional()
    @IsString()
    description : string
}

export class updateBookMarkDto  {
    @IsNotEmpty()
    @IsString()
    title : string
  
    @IsNotEmpty()
    @IsString()
    link : string

    @IsNotEmpty()
    @IsBoolean()
    pinned : boolean
    
    @IsNotEmpty()
    @IsBoolean()
    isBookMarkImageChanged : boolean
    
    @IsOptional()
    @IsString()
    priority : string
    
    @IsOptional()
    @IsArray()
    hashTags : string[]

    @IsNotEmpty()
    @IsOptional()
    fileId : string
    
    @IsOptional()
    @IsString()
    description : string
}


export const bookMarkBasicQuery = [
    {
        $lookup: {
            from: "filesystems",
            localField: "fileId",
            foreignField: "_id",
            as: "file",
        },
    },
    {
        $unwind: "$file",
    },
    {
        $project: {
            title: 1,
            description: 1,
            priority: 1,
            hashTags: 1,
            link: 1,
            fileId: 1,
            createdAt: 1,
            pinned : 1,
            bookMarkImageLink: "$file.link"
        },
    },
]