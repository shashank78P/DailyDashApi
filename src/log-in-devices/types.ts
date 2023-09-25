import { IsEmail, IsString, IsStrongPassword, isString } from "class-validator"

export enum deviceType {
    MOBILE = "MOBILE",
    TAB = "TAB",
    LAPTOP = "LAPTOP",
    COMPUTER = "COMPUTER"
}


export interface JwtPayload {
    userId: string,
    loginId: string,
    deviceId: string
}


export interface googleCredential {
    email: string,
    given_name: string,
    family_name: string,
    picture: string
}

export class resetPasswordDto {
    @IsEmail()
    email: string

    @IsStrongPassword()
    password: string

    @IsStrongPassword()
    confirmPassword: string

    @IsString()
    ip: string
}