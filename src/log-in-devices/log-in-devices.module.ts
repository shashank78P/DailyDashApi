import { Module } from '@nestjs/common';
import { LogInDevicesController } from './log-in-devices.controller';
import { UsersService } from 'src/users/users.service';
import { LogInDevicesService } from './log-in-devices.service';
import { UsersModule } from 'src/users/users.module';
import { LogInDevicesSchema, LogInDevices } from './schema/log-in-details.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from 'src/users/schema/users.schema';
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { JwtStratery } from './jwt.stratergy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    // PassportModule,
    MongooseModule.forFeature([{ name: LogInDevices.name, schema: LogInDevicesSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
    UsersModule,


    JwtModule.register(
      {
        secret: "DailyDashSceret",
        signOptions: {
          expiresIn: 3600,
        }
      }
    )
  ],
  controllers: [LogInDevicesController],
  providers: [LogInDevicesService, UsersService, JwtStratery],
  exports: [JwtStratery, PassportModule]
})
export class LogInDevicesModule { }
