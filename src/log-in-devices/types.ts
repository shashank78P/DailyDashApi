import { IsEmail, IsString, IsStrongPassword } from "class-validator"

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