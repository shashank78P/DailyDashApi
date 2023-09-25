import { IsDate, IsEmail, IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, IsStrongPassword, MinLength } from "class-validator";


export class signInDto {
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    confirmPassword: string
}

export class UserDataDto {
    @IsString()
    @IsNotEmpty()
    firstName: string

    @IsString()
    @IsOptional()
    middleName: string

    @IsOptional()
    @IsString()
    lastName: string

    @IsDate()
    dob: string

    @IsOptional()
    @IsNumber()
    @IsPhoneNumber("IN")
    phone: number

    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    confirmPassword: string
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName: string

    @IsOptional()
    @IsString()
    middleName: string

    @IsOptional()
    @IsString()
    lastName: string

    @IsDate()
    @IsOptional()
    dob: string

    @IsOptional()
    @IsNumber()
    phone: number

    @IsString()
    @IsEmail()
    @IsOptional()
    email: string
}

export class UserDataForSignIn {
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    password: string

    // @IsString()
    // @IsNotEmpty()
    // Browser: string

    // @IsString()
    // @IsNotEmpty()
    // deviceType: string

    // @IsString()
    // @IsNotEmpty()
    // os: string

    // @IsString()
    // @IsNotEmpty()
    // engine: string

    // @IsString()
    // @IsNotEmpty()
    // type: string

    // @IsString()
    // @IsNotEmpty()
    // logInId: string

    // @IsString()
    // @IsNotEmpty()
    // createdAt: Date

    // @IsString()
    // @IsNotEmpty()
    // updatedAt: Date

}

export class _idDto {
    @IsString()
    @IsNotEmpty()
    _id: string
}