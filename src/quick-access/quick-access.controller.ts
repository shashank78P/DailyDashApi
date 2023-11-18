import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { QuickAccessService } from './quick-access.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';
import { QuickAccessDto } from './type';

@Controller('quick-access')
@UsePipes(ValidationPipe)
export class QuickAccessController {
    constructor(
        private readonly QuickAccessService: QuickAccessService,
    ) { }

    @UseGuards(AuthGuard())
    @Get("/get")
    async getQuickAccess(
        @CurrentUser() user: any
    ) {
        return await this.QuickAccessService.getQuickAccess(user);
    }

    @UseGuards(AuthGuard())
    @Post("/add")
    async addQuickAccess(
        @Body() data: QuickAccessDto,
        @CurrentUser() user: any
    ) {
        return await this.QuickAccessService.addQuickAccess(user, data);
    }
    
    @UseGuards(AuthGuard())
    @Put("/edit")
    async editQuickAccess(
        @Body() data: QuickAccessDto,
        @Query("_id") _id : string,
        @CurrentUser() user: any
    ) {
        return await this.QuickAccessService.editQuickAccess(user, data , _id);
    }

    @UseGuards(AuthGuard())
    @Delete("/add")
    async deleteQuickAccess(
        @Query("id") id: string,
        @CurrentUser() user: any
    ) {
        return await this.QuickAccessService.deleteQuickAccess(user, id);
    }
}
