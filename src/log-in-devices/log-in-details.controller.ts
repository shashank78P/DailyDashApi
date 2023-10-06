import { Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogInDetailsService } from "./log-in-details.service"
import { UsersService } from "../users/users.service"
import { UserDataForLoginIn, signInDto } from 'src/users/types.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './currentUser.decorator';
import * as http from "node:http"
import { IsString } from 'class-validator';
import { BlockLogInDevicesDto, forgetpasswordDto, googleCredential, googleCredentialDto, resetPasswordDto } from './types';

@Controller('log-in-details')
@UsePipes(ValidationPipe)
export class LogInDevicesController {
    constructor(
        private readonly LogInDevicesService: LogInDetailsService,
        private readonly UsersService: UsersService,
    ) { }

    @Post("/login")
    async LogIn(
        @Body() userData: UserDataForLoginIn,
        @Res() res,
        @Req() req,
    ) {
        return this.LogInDevicesService.logIn(userData,res, req);
    }
    
    @Post("/signin")
    async SignIn(
        @Body() userData: signInDto,
        @Res() res,
        @Req() req,
    ) {
        res.send(
            await this.LogInDevicesService.Signin(userData,res, req)
            );
    }
    
    

    // @UseGuards(AuthGuard())
    @Get("/")
    async getDemo(
        @Req() req,
        // @CurrentUser() user
    ) {
        const ipAddress = req.headers['x-forwarded-for']
            || req.socket.remoteAddress
            || req.headers['cf-connecting-ip']
            || req.headers['c-real-ip'];
        // console.log('Client IP address:', ipAddress);
        // console.log(req.headers)
        // console.log(req.socket.remoteAddress)
        // console.log(req.headers['x-forwarded-for'])
        // console.log(req.headers['cf-connecting-ip'])
        // console.log(req.headers['c-real-ip'])
        // console.log(req.headers['user-agent'])
        // return user;
        return ipAddress
    }

    @Post("/google-log-in-details")
    async GoogleeLogIn(
        @Body() body: googleCredentialDto,
        @Res() res: any,
        @Req() req: any,

    ) {
        return await this.LogInDevicesService.googleLogin(body, res, req);
    }

    @Post("send-mail-to-resent-password")
    async resendPassword(
        @Query("email") email: string,
    ) {
        return await this.LogInDevicesService.sendMailToResetPassword(email)
    }

    @Put("reset-password")
    async resetPassword(
        @Body() data: resetPasswordDto
    ) {
        return await this.LogInDevicesService.reSetPassword(data);
    }
    
    @Put("block-log-in-device")
    async blockLogInDevices(
        @Body() data: BlockLogInDevicesDto
        ) {
            return await this.LogInDevicesService.blockLogInDevice(data);
        }
        
    @Post("/forget-password")
    async forgetPassword(
        @Body() data: forgetpasswordDto
    ){
        const {email} = data;
        return await this.LogInDevicesService.sendMailToResetPassword(email)
    }


}


