import { Body, Controller, Post, Get, UseGuards, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { MeetService } from "./meet.service"
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';
import { createMeetingDto } from './type';
import { UsersService } from "../users/users.service"

@Controller('meet')
@UsePipes(ValidationPipe)
export class MeetController {
    constructor(
        private readonly MeetService: MeetService,
        private readonly UsersService: UsersService,
    ) { }

    @UseGuards(AuthGuard())
    @Post("/create-meeting")
    async createMeeting(
        @Body() data: createMeetingDto,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.createMeeting(user, data);
    }

    @UseGuards(AuthGuard())
    @Get("/get-meeting-details")
    async getMeetingDetails(
        @Query("meetingId") meetingId: string,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.getMeetingDetails(user, meetingId);
    }

    @UseGuards(AuthGuard())
    @Get("get-all-active-participants")
    async getAllParticipants(
        @Query("meetingId") meetingId: string,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.getAllActiveParticipants(user , meetingId)
    }


}
