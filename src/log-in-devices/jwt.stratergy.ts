import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from './types';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import mongoose, { Model } from 'mongoose';
import { LogInDetails, LogInDocument } from './schema/log-in-details.schema';
import { JwtService } from '@nestjs/jwt';

const cookieExtractor = (req) => {
  let token = null;
  // console.log('extracting data from cookie ', req.cookies);
  if (req && req.cookies) {
    console.log('req.cookies==>', req.cookies);
    const authorization = req.cookies['authorization'];
    console.log('authorization==>', authorization);
    if (authorization) token = authorization.replace('Bearer ', '');
  }
  // console.log(token);
  return token;
};

@Injectable()
export class JwtStratery extends PassportStrategy(Strategy) {
  constructor(
    private jwtService: JwtService,
    @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
    @InjectModel(LogInDetails.name)
    private LogInDeviceModel: Model<LogInDocument>,
  ) {
    super({
      secretOrKey: 'DailyDash51',
      //   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: cookieExtractor,
    });
  }

  async validate(payload: any, req: Request) {
    try {
      // console.log('jwt strtergy');
      // console.log('payload =>', payload);
      const { userId, loginId } = payload;
      console.log(userId, loginId);
      const user = await this.UsersModel.findOne(
        {
          _id: new mongoose.Types.ObjectId(userId),
        },
        { password: 0 },
      );
      const deviceDetails = await this.LogInDeviceModel.findOne({
        logInId: loginId,
        userId: new mongoose.Types.ObjectId(userId),
      });
      // console.log(deviceDetails);
      if (!(userId && deviceDetails)) {
        throw new UnauthorizedException();
      }
      // console.log('after getting all data');
      const userData = {
        ...deviceDetails,
        ...user,
      };
      userData["_doc"]["userId"] = new mongoose.Types.ObjectId(userId)
      req["user"] = userData;
      return userData;
    } catch (err) {
      throw new InternalServerErrorException(err?.message);
    }
  }
}
