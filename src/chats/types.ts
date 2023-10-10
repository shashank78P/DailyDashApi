import { IsNotEmpty, IsString } from "class-validator";

export class findUserToInitialChatDto{
    @IsString()
    @IsNotEmpty()
    email : string
}

export class getAllChatDto{
    @IsNotEmpty()
    @IsString()
    belongsTo :string

    @IsNotEmpty()
    skip:string

    @IsNotEmpty()
    limit :string
}

export class addChatDto{
    @IsNotEmpty()
    @IsString()
    belongsTo :string

    @IsNotEmpty()
    @IsString()
    message :string
    
    @IsNotEmpty()
    @IsString()
    userId :string
    
    @IsNotEmpty()
    @IsString()
    to :string
    
}

export class createGroupDto{
    @IsNotEmpty()
    @IsString()
    groupName :string
    
    @IsNotEmpty()
    users :string[]

}

export enum role{
    ADMIN = "ADMIN",
    CO_ADMIN = "CO_ADMIN",
    MEMBER = "MEMBER"
}