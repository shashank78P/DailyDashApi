import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, isString } from "class-validator"

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


export class googleCredentialDto {

    @IsNotEmpty()
    @IsString()
    credential: string

    @IsNotEmpty()
    @IsString()
    os: string

    @IsNotEmpty()
    @IsString()
    browser: string

    @IsNotEmpty()
    @IsString()
    select_by: string
}
export interface googleCredential {
    email: string,
    given_name: string,
    family_name: string,
    picture: string
}

export class resetPasswordDto {

    @IsStrongPassword()
    password: string

    @IsStrongPassword()
    confirmPassword: string

    @IsString()
    token: string
}

export class BlockLogInDevicesDto {

    @IsStrongPassword()
    password: string
    
    @IsString()
    logInId: string

    @IsEmail()
    email: string
}

export class forgetpasswordDto{
    @IsEmail()
    email: string
}