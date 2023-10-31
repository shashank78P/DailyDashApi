import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogInDetails, LogInDocument, LogInDetailsSchema } from './schema/log-in-details.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UserDataForLoginIn, signInDto } from 'src/users/types.dto';
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { JwtModule, JwtService } from "@nestjs/jwt"
import { MailServiceService } from 'src/mail-service/mail-service.service';
import { BlockLogInDevicesDto, googleCredential, resetPasswordDto } from './types';
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
                    // secret: "DailyDash"
                }
            )
            return token
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async googleLogin(body: any, res: Response, req: Request) {
        try {
            const { email, given_name, family_name, picture }: googleCredential = jwtDecode(body?.credential);
            const { os, browser } = body;
            console.log(os, browser)
            let isUserExist = await this.UsersModel.findOne({ email: email });

            if (isUserExist == undefined || isUserExist == null) {
                await this.UsersModel.insertMany([{
                    email: email,
                    firstName: given_name,
                    os, browser,
                    lastName: family_name,
                    profilePic: picture, isEmailVerified: false, isMediaSignUp: true,
                    userAgent: req.headers['user-agent']
                }])
                isUserExist = await this.UsersModel.findOne({ email: email });
            }
            const logInId = await uuid()


            if (!isUserExist?._id) {
                new BadRequestException("Invalid");
            }

            const result = await this.createNewLogInDetails(isUserExist?._id.toString(), logInId, req, os, browser)
            // this.sendLogInAlert(isUserExist, email, logInId);
            if (!isUserExist?.password) {
                // this.sendMailToResetPassword(email);
            }
            return this.setCookieForWhileLogIn(isUserExist, logInId, res);

        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async Signin(body: signInDto, res: Response, req: Request) {
        try {
            const { email, firstName, lastName, os, browser } = body;
            console.log(email)

            let isUserExist = await this.UsersModel.findOne({ email: email });
            console.log(isUserExist)

            if (!isUserExist) {
                console.log("isUserExist")
                await this.UsersModel.insertMany([{
                    email: email,
                    firstName,
                    lastName,
                    os, browser,
                    isEmailVerified: false,
                    isMediaSignUp: false,
                    userAgent: req.headers['user-agent']
                }])

                return await this.sendMailToResetPassword(email)
            } else {
                console.log("isUserExist===")
                throw new BadRequestException("Account already exist, Please LogIn!!");
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async createNewLogInDetails(userId, logInId, req, os, browser) {
        try {
            if (!(userId && logInId)) {
                throw new BadRequestException("Invalid Credentials")
            }

            const result = await this.LogInDetailsModel.insertMany([{
                userId: new mongoose.Types.ObjectId(userId),
                logInId,
                os, browser,
                userAgent: req.headers['user-agent'],
                createdAt: new Date(),
                updatedAt: new Date(),
            }])

            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async sendLogInAlert(isUserExist, email, logInId) {
        let text = "";
        let htmlData = '<h1>Hello <strong>${isUserExist?.firstName + " " + isUserExist?.lastName}</strong>,\n\nWe noticed a login to your account from a new device.  If this was not you, please take immediate action to secure your account.</h1>';
        let subject = `Security Alert!!!`
        this.mailService.sendMail(email, subject, text, "Alert", { link: `${"http://localhost:3000/block?email=" + email + "&logInId=" + logInId}`, firstName: isUserExist?.firstName, lastName: isUserExist?.lastName });

    }

    async setCookieForWhileLogIn(isUserExist, logInId, res) {
        // generating a token
        const token = await this.generateToken({ userId: isUserExist._id, loginId: logInId }, "1d");

        const { _id, firstName, lastName, email, isEmailVerified } = isUserExist
        // creating a cookie object
        let cookieData = { _id, firstName, lastName, email, logInId, isEmailVerified };
        delete cookieData["password"];
        // res.user = cookieData
        console.log("setting cookie")

        return res.cookie("authorization", `Bearer ${token}`, {
            httpOnly: true,
            // secure: false,
            maxAge: Date.now() + 60 * 60,   //1hr
            domain: 'daily-dash.vercel.app',
  secure: true // cookie will only be sent over HTTPS
            // sameSite: "lax",
            // sameSite: "None",
            // domain: "localhost",
            domain: 'daily-dash.vercel.app',
            secure: true // cookie will only be sent over HTTPS
        })
            .json(cookieData)
    }

    // signing in with email and password
    async logIn(userData: UserDataForLoginIn, res: Response, req: Request) {
        try {
            const { password, email, os, browser } = userData;
            console.log(userData)
            if (!email || !password) {
                throw new BadRequestException("Requirements are not satisfied");
            }
            const isUserExist = await this.UsersModel.findOne({ email });
            console.log(isUserExist)

            if (!isUserExist) {
                throw new BadRequestException("No user find with this email");
            }
            if (!isUserExist?.password) {
                throw new BadRequestException("U haven't set password yet!... set password and try later");
            }

            // comparing a password
            const isPasswordMatched = await bcrypt.compare(password, isUserExist?.password)
            console.log(isPasswordMatched)

            if (!isPasswordMatched) {
                throw new InternalServerErrorException("Invalid login");
            }
            const logInId = await uuid()
            console.log(logInId)

            let result = await this.createNewLogInDetails(isUserExist?._id, logInId, req, os, browser)
            // this.sendLogInAlert(isUserExist, email);

            return await this.setCookieForWhileLogIn(isUserExist, logInId, res);
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

    async sendMailToResetPassword(email: string) {
        try {
            if (!(email)) {
                throw new BadRequestException("requirements are not satisfied")
            }
            const isUserExist = await this.UsersModel.findOne({ email });

            if (!isUserExist) {
                throw new NotFoundException()
            }
            let passwordResetId: String = await uuid();
            let res = await this.UsersModel.updateOne({ _id: new mongoose.Types.ObjectId(isUserExist._id) }, { $set: { passwordResetId: passwordResetId, passwordResetUpdatedAt: new Date() } })

            const token = await this.generateToken({ userId: isUserExist?._id, passwordResetId }, "15m",);
            let Link = `http://localhost:3000/reset-password?token=${token}`

            await this.mailService.sendMail(
                email,
                "Response to re-set password",
                "",
                "password-reset",
                { link: Link, email }
            )
            return "Password re-set mail send sucessfully"
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async reSetPassword(data: resetPasswordDto) {
        try {
            let { confirmPassword, password, token } = data
            console.log("jwtDecodedData");
            let jwtDecodedData: any = await this.jwtService.verifyAsync(token);
            // {
            //  secret: "DailyDash"
            //  }
            // let jwtDecodedData: any = await this.jwtService.decode(token);
            console.log(jwtDecodedData);
            let { userId, passwordResetId } = jwtDecodedData
            if (!(confirmPassword && password)) {
                throw new BadRequestException("requirements are not satisfied")
            }

            if (password !== confirmPassword) {
                throw new BadRequestException("password and confirm password are mis-match ")
            }
            const isUserExist = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(userId), passwordResetId });


            if (!isUserExist) {
                console.log("not exist");
                throw new NotFoundException()
            }

            password = await bcrypt.hash(password.toString(), 12)
            const user = await this.UsersModel.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(userId) }, { password, passwordResetId: "", isEmailVerified: true, updatedAt: new Date() });
            if (!user) {
                throw new BadRequestException("Failed to re-set password")
            }
            await this.UsersModel.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
            return "Password reset successfull"
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async blockLogInDevice(data: BlockLogInDevicesDto) {
        try {
            const isLogInIdExist = await this.LogInDetailsModel.findOne({ logInId: data?.logInId });
            if (!isLogInIdExist) {
                throw new NotFoundException("LogInId not Found")
            }
            const isUserExist = await this.UsersModel.findOne({ email: data?.email });

            if (!isUserExist) {
                throw new NotFoundException()
            }
            const isPasswordMatched = await bcrypt.compare(data?.password, isUserExist.password)

            if (!isPasswordMatched) {
                throw new InternalServerErrorException("Invalid Credentials");
            }

            const isDeleted = await this.LogInDetailsModel.deleteOne({ logInId: data?.logInId })

            if (isDeleted) {
                return "Blocked Successfully"
            }
            throw new NotFoundException();
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}
