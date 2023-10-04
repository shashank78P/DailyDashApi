import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogInDetails, LogInDocument, LogInDetailsSchema } from './schema/log-in-details.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UserDataForSignIn } from 'src/users/types.dto';
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { JwtService } from "@nestjs/jwt"
import { MailServiceService } from 'src/mail-service/mail-service.service';
import { googleCredential, resetPasswordDto } from './types';
import jwtDecode from 'jwt-decode';
import { UsersService } from 'src/users/users.service';

@Injectable()
@UsePipes(ValidationPipe)
export class LogInDetailsService {
    constructor(
        private jwtService: JwtService,
        private mailService: MailServiceService,
        private userService: UsersService,
        @InjectModel(LogInDetails.name) private LogInDetailsModel: Model<LogInDocument>,
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

    async googleLogin(body: any, res: Response, req: Request) {
        try {
            console.log(body);
            console.log(req.headers);
            const { email, given_name, family_name, picture }: googleCredential = jwtDecode(body?.credential);
            console.log(email, given_name, family_name, picture);
            let isUserExist = await this.UsersModel.findOne({ email: email });

            if (isUserExist == undefined || isUserExist == null) {
                console.log(
                    await this.UsersModel.insertMany([{
                        email: email,
                        firstName: given_name,
                        lastName: family_name,
                        profilePic: picture, isEmailVerified: false, isMediaSignUp: true,
                        userAgent: req.headers['user-agent']
                    }])
                )
                isUserExist = await this.UsersModel.findOne({ email: email });
            }
            const logInId = await uuid()

            console.log("isUserExist");
            console.log(isUserExist);

            if (!isUserExist?._id) {
                new BadRequestException("Invalid");
            }

            const result = await this.createNewLogInDetails(isUserExist?._id.toString(), logInId, req)
            // this.sendLogInAlert(isUserExist, email);
            console.log("result =>", result);

            return this.setCookieForWhileLogIn(isUserExist, logInId, res);

        } catch (err) {
            new InternalServerErrorException(err?.message);
        }
    }
    async createNewLogInDetails(userId, logInId, req) {
        try {
            console.log("adding details")

            console.log(userId, logInId)

            if (!(userId && logInId)) {
                throw new BadRequestException("Invalid Credentials")
            }

            const result = await this.LogInDetailsModel.insertMany([{
                userId: new mongoose.Types.ObjectId(userId),
                logInId,
                userAgent: req.headers['user-agent'],
                createdAt: new Date(),
                updatedAt: new Date(),
            }])

            console.log("Login details are added ", result);
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    // async sendLogInAlert(isUserExist, email) {
    //     let text = "";
    //     let htmlData = '<h1>Hello <strong>${isUserExist?.firstName + " " + isUserExist?.lastName}</strong>,\n\nWe noticed a login to your account from a new device.  If this was not you, please take immediate action to secure your account.</h1>';
    //     let subject = `Security Alert!!!`
    //     this.mailService.sendMail(email, subject, text, "Alert", { link: "https://github.com/shashank78P", firstName: isUserExist?.firstName, lastName: isUserExist?.lastName });

    // }

    async setCookieForWhileLogIn(isUserExist, logInId, res) {
        // generating a token
        const token = this.generateToken({ userId: isUserExist._id, loginId: logInId }, "1d");

        const { _id, firstName, lastName, email } = isUserExist
        // creating a cookie object
        let cookieData = { _id, firstName, lastName, email, logInId };
        delete cookieData["password"];
        // res.user = cookieData
        res.cookie("authorization", `Bearer ${token}`, {
            httpOnly: true,
            secure: true,
            maxAge: Date.now() + 60 * 60,   //1hr
            sameSite: "lax",
            domain: "localhost",
        })
            .json(cookieData)
        return "Log in sucessfull";
    }

    // signing in with email and password
    async signIn(res, userData: UserDataForSignIn, req: Request) {
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

            let result = await this.createNewLogInDetails(isUserExist?._id, logInId, req)
            // this.sendLogInAlert(isUserExist, email);
            console.log("result =>", result);

            return this.setCookieForWhileLogIn(isUserExist, logInId, res);
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    // async signUp(data: ) {
    //     try {

    //     } catch (err) {
    //         new InternalServerErrorException(err?.message);
    //     }
    // }

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
