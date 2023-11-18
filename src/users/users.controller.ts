import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UserDataDto, _idDto, changeProfilePicDto } from "./types.dto"
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';

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
        @CurrentUser() user: any
    ) {
        return user;
    }

    @Get("/getUserByEmail")
    async getUserByEmail(
        @Query("email") email: string
    ) {
        return this.usersService.getUserByEmail(email);
    }

    @UseGuards(AuthGuard())
    @Get("/get-user-profile-pic")
    async getUserProfilePic(
        @Query("_id") _id: string,
        @CurrentUser() user: any
    ) {
        return this.usersService.getUserProfilePic(user, _id);
    }

    @Get("/getUserById")
    async getUserById(
        @Query("_id") _id: string
    ) {
        return this.usersService.getUserById(_id);
    }
    
    @UseGuards(AuthGuard())
    @Get("/getMineDetails")
    async getMineDetails(
        @CurrentUser() user: any
    ) {
        return this.usersService.getUserById(user?._id);
    }

    @Put("/updateUserDetails")
    async updateUser(
        @Body() userData: UpdateUserDto,
        @Query() _id: _idDto
    ) {
        console.log(userData);
        return this.usersService.updateUser(userData, _id["_id"]);
    }

    @UseGuards(AuthGuard())
    @Put("/updateMineDetails")
    async updateMineUser(
        @Body() userData: UpdateUserDto,
        @CurrentUser() user: any
    ) {
        console.log(userData);
        return this.usersService.updateUser(userData, user?._id);
    }


    @UseGuards(AuthGuard())
    @Put("/change-profile-pic")
    async changeProfilePic(
        @Body() profilePic: changeProfilePicDto,
        @CurrentUser() user: any
    ) {
        return this.usersService.changeProfilePic(profilePic, user);
    }

    // @Post("/signIn")
    // async signIn(
    //     @Body() userData: UserDataForSignIn,
    // ) {
    //     console.log(userData);
    //     return this.usersService.signIn(userData);
    // }
}
