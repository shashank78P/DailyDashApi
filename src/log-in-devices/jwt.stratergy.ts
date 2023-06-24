import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt"
import { JwtPayload } from "./types";
import { InjectModel } from "@nestjs/mongoose";
import { Users, UsersDocument } from "src/users/schema/users.schema";
import mongoose, { Model } from "mongoose";
import { LogInDevices, LogInDevicesDocument } from "./schema/log-in-details.schema";

const cookieExtractor = (req) => {
    let token = null
    console.log("extracting data from cookie ", req.cookies)
    if (req && req.cookies) {
        console.log("req.cookies==>", req.cookies)
        const authorization = req.cookies["authorization"]
        console.log("authorization==>", authorization)
        if (authorization) token = authorization.replace("Bearer ", "")
    }

    return token
}

@Injectable()
export class JwtStratery extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
        @InjectModel(LogInDevices.name) private LogInDeviceModel: Model<LogInDevicesDocument>,
    ) {
        super({
            // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            jwtFromRequest: cookieExtractor,
            secretOrKey: "DailyDashSceret"
        })
    }

    async validate(payload: JwtPayload) {
        try {
            console.log("jwt strtergy");
            console.log("payload =>", payload)
            const { userId, loginId, deviceId } = payload;
            console.log(userId, loginId, deviceId)
            const user = await this.UsersModel.findOne({
                _id: new mongoose.Types.ObjectId(userId)
            }, { password: 0 })
            console.log(user)
            const deviceDetails = await this.LogInDeviceModel.findOne({
                _id: new mongoose.Types.ObjectId(deviceId),
                userId: new mongoose.Types.ObjectId(userId)
            })
            console.log(deviceDetails)
            if (!(userId && deviceDetails)) {
                throw new UnauthorizedException();
            }
            console.log("after getting all data")
            const userData = { ...user, ...deviceDetails, deviceId: deviceDetails?._id }
            delete userData?.["_id"]
            return userData
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }
}