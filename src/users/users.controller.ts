import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UserDataDto, _idDto } from "./types.dto"
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @Post("/addUser")
    async createUser(
        @Body() userData: UserDataDto,
        @Req() req: any
    ) {
        console.log(userData);
        return this.usersService.createUser(userData, req);
    }

    @UseGuards(AuthGuard())
    @Get("/authme")
    async AuthMe(
        @Query("email") email: string
    ) {
        return this.usersService.getUserByEmail(email);
    }
    @Get("/getUserByEmail")
    async getUserByEmail(
        @Query("email") email: string
    ) {
        return this.usersService.getUserByEmail(email);
    }

    @Get("/getUserById")
    async getUserById(
        @Query("_id") _id: string
    ) {
        return this.usersService.getUserById(_id);
    }

    @Put("/updateUserDetails")
    async updateUser(
        @Body() userData: UpdateUserDto,
        @Query() _id: _idDto
    ) {
        console.log(userData);
        return this.usersService.updateUser(userData, _id["_id"]);
    }

    // @Post("/signIn")
    // async signIn(
    //     @Body() userData: UserDataForSignIn,
    // ) {
    //     console.log(userData);
    //     return this.usersService.signIn(userData);
    // }
}
