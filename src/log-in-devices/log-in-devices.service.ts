import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LogInDevices, LogInDevicesDocument } from './schema/log-in-details.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UserDataForSignIn } from 'src/users/types';
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { JwtService } from "@nestjs/jwt"

@Injectable()
export class LogInDevicesService {
    constructor(
        private jwtService: JwtService,
        @InjectModel(LogInDevices.name) private LogInDeviceModel: Model<LogInDevicesDocument>,
        @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
    ) { }

    async addDeviceDetails(userId, ip, logInId) {
        try {
            console.log("adding device details")
            console.log(userId, ip, logInId)
            if (!(userId && ip && logInId)) {
                throw new BadRequestException("Invalid Credentials")
            }
            let isOwner = false;
            const ownerDevice = await this.LogInDeviceModel.findOne({ userId: new mongoose.Types.ObjectId(userId), })

            console.log("ownerDevicem found => ", ownerDevice)
            if (!ownerDevice) {
                isOwner = true
            }
            const result = await this.LogInDeviceModel.insertMany([{
                userId: new mongoose.Types.ObjectId(userId),
                ip,
                logInId,
                isOwner,
                createdAt: new Date(),
                updatedAt: new Date(),
            }])

            console.log("after adding device details", result);
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    // signing in with email and password
    async signIn(res, userData: UserDataForSignIn, ip: string) {
        try {
            const { password, email } = userData;
            if (!email || !password) {
                throw new BadRequestException("Requirements are not satisfied");
            }
            const isUserExist = await this.UsersModel.findOne({ email });
            console.log("user exist =>", isUserExist);
            if (!isUserExist) {
                throw new BadRequestException("No user find with this email");
            }
            const isPasswordMatched = await bcrypt.compare(password, isUserExist.password)
            console.log("isPasswordMatched=>", isPasswordMatched)
            if (!isPasswordMatched) {
                throw new InternalServerErrorException("Invalid login");
            }
            const logInId = await uuid()

            // checking user has previously loged in with same ip
            // if so update only login id
            // else create a new document for it
            const isUserDeviceAlreadyExist = await this.LogInDeviceModel.findOne({
                userId: new mongoose.Types.ObjectId(isUserExist?._id),
                ip,
            });
            console.log("isUser already exist", isUserDeviceAlreadyExist)
            let deviceDetails;
            if (isUserDeviceAlreadyExist) {
                deviceDetails = await this.LogInDeviceModel.findOneAndUpdate({
                    userId: new mongoose.Types.ObjectId(isUserExist?._id),
                    ip
                }, { set: { logInId } })
            } else {
                let result = await this.addDeviceDetails(isUserExist?._id, ip, logInId)
                console.log("result =>", result)
                deviceDetails = result?.[0]
            }
            if (!deviceDetails?._id) {
                throw new BadRequestException("device details")
            }
            console.log("deviceId: =>", deviceDetails._id)
            const token = await this.jwtService.signAsync(
                { userId: isUserExist._id, loginId: logInId, deviceId: deviceDetails["_id"] },
                {
                    expiresIn: "1d",
                }
            )
            console.log("token=>", token);
            // const loginDetails = await this
            let cookieData = { ...deviceDetails, ...isUserExist }
            delete cookieData["password"];
            console.log("cookieData =>", cookieData)
            res.user = cookieData
            res.cookie("authorization", `Bearer ${token}`, {
                httpOnly: true,
                secure: true,
                maxAge: Date.now() + 60 * 60,
                sameSite: "lax",
                domain: "localhost"
            })
                .json(cookieData)
            // console.log("loginDetails", )
            return "Log in sucessfull";

        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }
}
