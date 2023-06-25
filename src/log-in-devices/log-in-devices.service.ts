import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogInDevices, LogInDevicesDocument } from './schema/log-in-details.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UserDataForSignIn } from 'src/users/types.dto';
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { JwtService } from "@nestjs/jwt"
import { MailServiceService } from 'src/mail-service/mail-service.service';
import { resetPasswordDto } from './types';

@Injectable()
@UsePipes(ValidationPipe)
export class LogInDevicesService {
    constructor(
        private jwtService: JwtService,
        private mailService: MailServiceService,
        @InjectModel(LogInDevices.name) private LogInDeviceModel: Model<LogInDevicesDocument>,
        @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
    ) { }

    async generateToken(payload: Object, expire: string) {
        try {
            const token = await this.jwtService.signAsync(
                payload,
                {
                    expiresIn: expire,
                }
            )
            console.log("token=>", token);
            return token
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

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

            if (!isUserExist) {
                throw new BadRequestException("No user find with this email");
            }

            // comparing a password
            const isPasswordMatched = await bcrypt.compare(password, isUserExist.password)


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
                // same device then updating a login id
                deviceDetails = await this.LogInDeviceModel.findOneAndUpdate({
                    userId: new mongoose.Types.ObjectId(isUserExist?._id),
                    ip
                }, { set: { logInId } })
            } else {
                let result = await this.addDeviceDetails(isUserExist?._id, ip, logInId)
                // mailService.sendMail();
                let text = "";
                let htmlData = "";
                let subject = `Hello,\n\nWe noticed a login to your account from a new device (${UserDataForSignIn["deviceType"]}).
                 If this was not you, please take immediate action to secure your account.`
                this.mailService.sendMail(email, subject, text, htmlData, "");
                console.log("result =>", result)
                deviceDetails = result?.[0]
            }
            if (!deviceDetails?._id) {
                throw new BadRequestException("device details")
            }
            console.log("deviceId: =>", deviceDetails._id);

            // generating a token
            const token = this.generateToken({ userId: isUserExist._id, loginId: logInId, deviceId: deviceDetails["_id"] }, "1d");

            // creating a cookie object
            let cookieData = { ...deviceDetails, ...isUserExist }
            delete cookieData["password"];
            // res.user = cookieData
            res.cookie("authorization", `Bearer ${token}`, {
                httpOnly: true,
                secure: true,
                maxAge: Date.now() + 60 * 60,
                sameSite: "lax",
                domain: "localhost"
            })
                .json(cookieData)
            return "Log in sucessfull";

        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async sendMailToResentPassword(email: string, ip: string) {
        try {
            if (!(email && ip)) {
                throw new BadRequestException("requirements are not satisfied")
            }
            const isUserExist = await this.UsersModel.findOne({ email });

            if (!isUserExist) {
                throw new NotFoundException()
            }

            const token = await this.generateToken({ userId: isUserExist?._id }, "15m");
            let Link = `http://localhost:3001/reset-password?token=${token}`

            await this.mailService.sendMail(
                email,
                "Response to re-set password",
                `This email is to re-set a password \n\nclick below link to re-set password \n\n${Link}`,
                "password-reset.ejs",
                { link: Link }
            )
            return "Mail send sucessfully"
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async reSetPassword(data: resetPasswordDto, token: string) {
        try {
            let jwtDecodedData: any = await this.jwtService.decode(token);
            console.log(jwtDecodedData)
            let { userId } = jwtDecodedData
            let { email, confirmPassword, password, ip } = data
            if (!(email && ip && confirmPassword && password)) {
                throw new BadRequestException("requirements are not satisfied")
            }

            if (password !== confirmPassword) {
                throw new BadRequestException("password and confirm password are mis-match ")
            }
            console.log(userId, password, confirmPassword, ip, email)
            const isUserExist = await this.UsersModel.findOne({ email, _id: userId });

            console.log(isUserExist)

            if (!isUserExist) {
                throw new NotFoundException()
            }

            password = await bcrypt.hash(password.toString(), 12)
            const user = await this.UsersModel.findOneAndUpdate({ email }, { password });
            if (!user) {
                throw new BadRequestException("Failed to re-set password")
            }
            return user
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }
}
