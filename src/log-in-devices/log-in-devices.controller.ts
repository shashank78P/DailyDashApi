import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { LogInDevicesService } from "./log-in-devices.service"
import { UsersService } from "../users/users.service"
import { UserDataForSignIn } from 'src/users/types';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './currentUser.decorator';

@Controller('log-in-details')
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
        console.log(user)
        console.log(req?.user)
        return user;
    }


}
