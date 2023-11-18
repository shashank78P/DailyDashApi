import { Body, Controller, Post, Get, UseGuards, UsePipes, ValidationPipe, Query, Put } from '@nestjs/common';
import { MeetService } from "./meet.service"
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';
import { createMeetingDto, invitePeopleForMeetingDto } from './type';
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
    @Put("/update-meeting")
    async updateMeeting(
        @Body() data: createMeetingDto,
        @CurrentUser() user: any,
        @Query("meetingId") meetingId: string,
    ) {
        return await this.MeetService.updateMeeting(user, data, meetingId);
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
    @Get("get-all-active-not-active-participants")
    async getAllParticipants(
        @Query("meetingId") meetingId: string,
        @Query("isActive") isActive: string,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.getAllActiveOrNonActiveParticipants(user, meetingId, isActive)
    }

    @UseGuards(AuthGuard())
    @Get("get-added-participants")
    async getAllAddedParticipants(
        @Query("meetingId") meetingId: string,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.getAllAddedParticipants(user, meetingId)
    }

    @UseGuards(AuthGuard())
    @Post("invite-people-for-meeting")
    async invitePeopleForMeeting(
        @Body() body: invitePeopleForMeetingDto,
        @CurrentUser() user: any
    ) {
        const { invitingPropeList, meetingId } = body;
        return await this.MeetService.invitePeopleForMeeting(user, invitingPropeList, meetingId)
    }

    @UseGuards(AuthGuard())
    @Get("get-scheduled-meeting-list-of-mine")
    async getScheduledMeetingListOfMine(
        @Query("limit") limit: number,
        @Query("page") page: number,
        @Query("search") search: string,
        @Query("status") status: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: number,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.getScheduledMeetingListOfMine(user, limit, page, search, sortBy, sortOrder, status)
    }

    @UseGuards(AuthGuard())
    @Get("get-individual-meeting-details")
    async getIndividualMeetingDetails(
        @Query("meetingId") meetingId: string,
        @CurrentUser() user: any
    ) {
        return await this.MeetService.getIndividualMeetingDetails(user, meetingId)
    }



}
