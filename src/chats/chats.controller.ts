import { Body, Controller, Get, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { UsersService } from 'src/users/users.service';
import { AddUserToGroupDto, FileBodyBto, createGroupDto, editGroupNameDescDto, findUserToInitialChatDto, getAllChatDto } from './types';
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
    @Get("/getUserOfMyContactExceptParticularGroup")
    async getUserOfMyContactExceptParticularGroup(
        @Query("limit") limit: number,
        @Query("skip") skip: number,
        @CurrentUser() user: any,
        @Query("belongsTo") belongsTo: string,
        @Query("search") search?: string,
    ) {
        return await this.ChatsService.getUserOfMyContactExceptParticularGroup(user, limit, skip, belongsTo, search);
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
    @Post("/AddUserToGroup")
    async AddUserToGroup(
        @Body() body: AddUserToGroupDto,
        @CurrentUser() user: any,
    ) {
        return await this.ChatsService.AddUserToGroup(user, body);
    }
    
    @UseGuards(AuthGuard())
    @Get("/generateInviteLink")
    async GenerateInviteLink(
        @Query("belongsTo") belongsTO:string,
        @Query("lifeSpan") lifeSpan:string,
        @CurrentUser() user: any,
    ) {
        return await this.ChatsService.GenerateInviteLink(user, belongsTO , lifeSpan);
    }
    
    @UseGuards(AuthGuard())
    @Get("/getAllInitiatedChatGroupList")
    async getAllInitiatedChatGroupList(
        @CurrentUser() user: any,
    ) {
        return await this.ChatsService.getAllInitiatedChatGroupList(user);
    }
    
    @UseGuards(AuthGuard())
    @Put("/editGroupNameDesc")
    async editGroupNameDesc(
        @CurrentUser() user: any,
        @Body() data: editGroupNameDescDto,
    ) {
        return await this.ChatsService.editGroupNameDesc(user , data);
    }
    
    @UseGuards(AuthGuard())
    @Get("/getProfileDetails")
    async getProfileDetails(
        @CurrentUser() user: any,
        @Query("belongsTo") belongsTo: string,
        @Query("type") type: string,
    ) {
        return await this.ChatsService.getProfileDetails(user , belongsTo,type);
    }
    
    @UseGuards(AuthGuard())
    @Put("/change-group-profile-pic")
    async changeGroupProfilePic(
        @CurrentUser() user: any,
        @Query("belongsTo") belongsTo: string,
        @Body() body : FileBodyBto
    ) {
        return await this.ChatsService.changeGroupProfilePic(user , belongsTo,body);
    }
    
    @UseGuards(AuthGuard())
    @Get("/group-details-from-invite-link")
    async GroupDetailsFromInviteLink(
        @CurrentUser() user: any,
        @Query("token") token: string,
    ) {
        return await this.ChatsService.GroupDetailsFromInviteLink(user ,token);
    }
    
    @UseGuards(AuthGuard())
    @Post("/join-group-from-invite-link")
    async JoinGroupFromInviteLink(
        @CurrentUser() user: any,
        @Query("token") token: string,
    ) {
        return await this.ChatsService.JoinGroupFromInviteLink(user ,token);
    }
    
}
