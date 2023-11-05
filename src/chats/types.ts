import { IsEmpty, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EventType } from "./schema/chat.schema";

export class findUserToInitialChatDto {
    @IsString()
    @IsNotEmpty()
    email: string
}

export class getAllChatDto {
    @IsNotEmpty()
    @IsString()
    belongsTo: string
    
    @IsOptional()
    @IsString()
    search: string

    @IsNotEmpty()
    skip: string

    @IsNotEmpty()
    limit: string
}

export enum MessageType {
    TEXT = "TEXT",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    IMAGE = "IMAGE",
    MEET = "MEET",
}

export class eventDto {
    @IsString()
    type : EventType

    @IsString()
    message : string
}

export class addChatDto {
    @IsNotEmpty()
    @IsString()
    belongsTo: string

    @IsString()
    message: string
    
    @IsNotEmpty()
    @IsString()
    messageType: MessageType
    
    @IsOptional()
    @IsString()
    fileId: string

    @IsNotEmpty()
    @IsString()
    userId: string

    @IsNotEmpty()
    @IsString()
    to: string
    
    event : eventDto
}

export class createGroupDto {
    @IsNotEmpty()
    @IsString()
    groupName: string

    @IsNotEmpty()
    users: string[]
}

export class AddUserToGroupDto {
    @IsNotEmpty()
    @IsString()
    belongsTo: string

    @IsNotEmpty()
    users: string[]
}

export enum role {
    ADMIN = "ADMIN",
    CO_ADMIN = "CO_ADMIN",
    MEMBER = "MEMBER"
}

export enum joined {
    ADDED = "ADDED",
    LINK = "LINK"
}

export class editGroupNameDescDto {
    @IsString()
    @IsOptional()
    description: string

    @IsString()
    @IsOptional()
    groupName: string

    @IsString()
    @IsOptional()
    belongsTo: string
}

export class FileBodyBto {
    @IsNotEmpty()
    @IsString()
    url: string

    @IsNotEmpty()
    @IsString()
    FileId: string
}

export class JoinMeet {
    @IsEmpty()
    @IsString()
    meetingId : string
}
