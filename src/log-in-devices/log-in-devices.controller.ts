import { Body, Controller, Get, Post, Put, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogInDevicesService } from "./log-in-devices.service"
import { UsersService } from "../users/users.service"
import { UserDataForSignIn } from 'src/users/types.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './currentUser.decorator';
import * as http from "node:http"
import { IsString } from 'class-validator';
import { resetPasswordDto } from './types';

@Controller('log-in-details')
@UsePipes(ValidationPipe)
export class LogInDevicesController {
    constructor(
        private readonly LogInDevicesService: LogInDevicesService,
        private readonly UsersService: UsersService,
    ) { }

    @Post("/login")
    async SignIn(
        @Body() userData: UserDataForSignIn,
        @Res() res,
        @Query("ip") ip: string
    ) {
        console.log(userData);
        return this.LogInDevicesService.signIn(res, userData, ip);
    }

    @UseGuards(AuthGuard())
    @Get("/")
    async getDemo(
        @Req() req,
        @CurrentUser() user
    ) {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log('Client IP address:', ipAddress);
        console.log(req.headers)
        console.log(req.socket.remoteAddress)
        console.log(req.connection.remoteAddress)
        console.log(req.headers['user-agent'])
        return user;
    }

    @Post("send-mail-to-resent-password")
    async resendPassword(
        @Query("email") email: string,
        @Query("ip") ip: string,
    ) {
        return await this.LogInDevicesService.sendMailToResentPassword(email, ip)
    }

    @Put("reset-password")
    async resetPassword(
        @Query("token") token: string,
        @Body() data: resetPasswordDto
    ) {
        return await this.LogInDevicesService.reSetPassword(data, token);
    }
}


