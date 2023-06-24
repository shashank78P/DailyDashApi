import { IsDate, IsEmail, IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, IsStrongPassword, MinLength } from "class-validator";

export class UserDataDto {
    @IsString()
    @IsNotEmpty()
    @IsEmpty()
    firstName: String

    @IsOptional()
    @IsString()
    middleName: String

    @IsOptional()
    @IsString()
    lastName: String

    @IsDate()
    dob: string

    @IsOptional()
    @IsNumber()
    @IsPhoneNumber("IN")
    phone: Number

    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: String

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: String

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    confirmPassword: String
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName: String

    @IsOptional()
    @IsString()
    middleName: String

    @IsOptional()
    @IsString()
    lastName: String

    @IsDate()
    @IsOptional()
    dob: string

    @IsOptional()
    @IsNumber()
    phone: Number

    @IsString()
    @IsEmail()
    @IsOptional()
    email: String
}

export class UserDataForSignIn {
    @IsEmail()
    @IsNotEmpty()
    email: String

    @IsString()
    @IsNotEmpty()
    password: String

    @IsString()
    @IsNotEmpty()
    Browser: String

    @IsString()
    @IsNotEmpty()
    deviceType: String

    @IsString()
    @IsNotEmpty()
    os: String

    @IsString()
    @IsNotEmpty()
    engine: String

    @IsString()
    @IsNotEmpty()
    type: String

    @IsString()
    @IsNotEmpty()
    logInId: String

    @IsString()
    @IsNotEmpty()
    createdAt: Date

    @IsString()
    @IsNotEmpty()
    updatedAt: Date

}

export class _idDto {
    @IsString()
    @IsNotEmpty()
    _id: string
}