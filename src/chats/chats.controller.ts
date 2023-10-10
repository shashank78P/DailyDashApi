import { Body, Controller, Get, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { UsersService } from 'src/users/users.service';
import { findUserToInitialChatDto, getAllChatDto } from './types';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';

@Controller('chats')
@UsePipes(ValidationPipe)
export class ChatsController {
    constructor(
        private readonly ChatsService: ChatsService,
    ) { }

    @UseGuards(AuthGuard())
    @Post("/findUserToInitialChat")
    async findUserToInitialChat(
        @Body() data: findUserToInitialChatDto,
        @CurrentUser() user: any
    ) {
        return await this.ChatsService.findUserToInitialChat(data, user);
    }


    @UseGuards(AuthGuard())
    @Get("/getAllInitiatedChatUserList")
    async getAllInitiatedChatUserList(
        @CurrentUser() user: any
    ) {
        return await this.ChatsService.getAllInitiatedChatUserList(user);
    }

    @UseGuards(AuthGuard())
    @Get("/getAllchat")
    async getAllChat(
        @CurrentUser() user: any,
        @Query() queryParams: getAllChatDto,
    ) {
        return await this.ChatsService.getAllChat(user, queryParams);
    }

    @UseGuards(AuthGuard())
    @Get("/setReadmessages")
    async setReadmessages(
        @CurrentUser() user: any,
        @Query("belongsTo")  belongsTo : string,
    ) {
        return await this.ChatsService.setReadmessages(user, belongsTo);
    }

}
