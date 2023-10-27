import { IsArray, IsDate, IsEmpty, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export enum WhoCanJoindDTO {
    ANY_ONE_WITH_MEET_LINK = "ANY_ONE_WITH_MEET_LINK",
    ONLY_OF_MY_CONTACT = "ONLY_OF_MY_CONTACT",
    MANUALLY_ADDED = "MANUALLY_ADDED"
}

export const allowedMeetingLength = [
    "15 min",
    "30 min",
    "45 min",
    "1 hr",
    "2 hr",
    "6 hr",
    "1 day",
]

export class createMeetingDto {
    @IsString()
    @IsNotEmpty()
    title : String
    
    @IsOptional()
    @IsString()
    description : String
    
    @IsNotEmpty()
    @IsString()
    meetingDate : Date
    
    @IsNotEmpty()
    @IsString()
    meetingLength : string

    @IsNotEmpty()
    @IsEnum(WhoCanJoindDTO)
    whoCanJoin : WhoCanJoindDTO

    @IsArray()
    @IsOptional()
    participantsEmail : Array<String>
}

export class invitePeopleForMeetingDto{

    @IsArray()
    @IsNotEmpty()
    invitingPropeList : string[]
    
    @IsString()
    @IsNotEmpty()
    meetingId : string
}