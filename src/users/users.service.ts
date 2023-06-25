import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ValidationError } from '@nestjs/common';
import { Users, UsersDocument } from './schema/users.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto, UserDataDto, UserDataForSignIn, _idDto } from "./types.dto"
import * as bcrypt from "bcryptjs"

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
    ) { }
    async getUserByEmail(email: string) {
        try {
            if (!email) {
                throw new BadRequestException("email required");
            }
            let result = await this.UsersModel.findOne({ email })
            if (!result) {
                throw new NotFoundException("No user found");
            }
            return result;
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async getUserById(_id: string) {
        try {
            if (!_id) {
                throw new BadRequestException("_id required");
            }
            let result = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (!result) {
                throw new NotFoundException("No user found");
            }
            return result;
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async createUser(userData: UserDataDto) {
        try {
            const { email, password, confirmPassword } = userData;
            const userHasAccountWithThisEmail = await this.UsersModel.findOne({ email });
            if (userHasAccountWithThisEmail) {
                throw new NotFoundException("User is already exist with this email");
            }
            if (password != confirmPassword) {
                throw new BadRequestException("Password mismatch");
            }
            console.log(userData);
            userData.password = await bcrypt.hash(userData.password.toString(), 12)
            const user = await this.UsersModel.insertMany([userData]);
            return user
        } catch (err) {

            throw new InternalServerErrorException(err?.message);
        }
    }

    async updateUser(userData: UpdateUserDto, _id: string) {
        try {
            if (!_id) {
                throw new BadRequestException("_id required");
            }

            const userExist = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(_id) });
            if (!userExist) {
                throw new BadRequestException("No user exist!!");
            }
            console.log(userData["email"])
            console.log(_id)
            if (userData["email"]) {
                const emailExist = await this.UsersModel.findOne({ email: userData["email"], _id: { $ne: new mongoose.Types.ObjectId(_id) } });
                console.log("enail exist", emailExist)
                if (emailExist) {
                    throw new BadRequestException("Email already exist")
                }
            }
            delete userData["password"];
            console.log("after password details", userData);
            const result = await this.UsersModel.findByIdAndUpdate(_id, userData);
            // { _id: new mongoose.Types.ObjectId(Id) }, { $set: userData }
            console.log("After update result =>", userData);
            return result
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

}
