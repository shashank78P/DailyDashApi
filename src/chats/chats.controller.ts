import { Body, Controller, Get, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { UsersService } from 'src/users/users.service';
import { createGroupDto, findUserToInitialChatDto, getAllChatDto } from './types';
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
        @Query("belongsTo") belongsTo: string,
        @Query("type") type: string,
    ) {
        return await this.ChatsService.setReadmessages(user, belongsTo,type);
    }

    @UseGuards(AuthGuard())
    @Get("/getUnReadMessagesCount")
    async getUnReadMessagesCount(
        @CurrentUser() user: any,
    ) {
        return await this.ChatsService.getUnReadMessagesCount(user);
    }

    @UseGuards(AuthGuard())
    @Get("/getUserOfMyContact")
    async getUserOfMyContact(
        @Query("limit") limit: number,
        @Query("skip") skip: number,
        @CurrentUser() user: any,
        @Query("search") search?: string,
    ) {
        return await this.ChatsService.getUserOfMyContact(user, limit, skip, search);
    }
    
    @UseGuards(AuthGuard())
    @Post("/createGroup")
    async createGroup(
        @Body() body: createGroupDto,
        @CurrentUser() user: any,
    ) {
        return await this.ChatsService.createGroup(user, body);
    }
    
    @UseGuards(AuthGuard())
    @Get("/getAllInitiatedChatGroupList")
    async getAllInitiatedChatGroupList(
        @CurrentUser() user: any,
    ) {
        return await this.ChatsService.getAllInitiatedChatGroupList(user);
    }

}
