import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createBookMarkDto, updateBookMarkDto } from './type';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';
import { BookMarksService } from './book-marks.service';

@Controller('book-marks')
@UsePipes(ValidationPipe)
export class BookMarksController {
    constructor(
        private readonly BookMarkServices: BookMarksService
    ) { }

    @UseGuards(AuthGuard())
    @Post("/create-book-mark")
    async createBookMark(
        @Body() data: createBookMarkDto,
        @CurrentUser() user: any
    ) {
        return await this.BookMarkServices.createBookMark(user, data)
    }

    @UseGuards(AuthGuard())
    @Put("/update-book-mark")
    async updateBookMark(
        @Body() data: updateBookMarkDto,
        @CurrentUser() user: any,
        @Query("bookMarkId") bookMarkId: string
    ) {
        return await this.BookMarkServices.updateBookMark(user, data, bookMarkId)
    }

    @UseGuards(AuthGuard())
    @Get("/book-mark-pagination")
    async BookMarkPagination(
        @CurrentUser() user: any,
        @Query("limit") limit: number,
        @Query("page") page: number,
        @Query("search") search: string,
        @Query("status") status: string,
        @Query("sortBy") sortBy: string,
        @Query("sortOrder") sortOrder: number,
        @Query("from") from: string,
        @Query("to") to: string,
    ) {
        return await this.BookMarkServices.getBookMarkPagination(user, limit, page, search, sortBy, sortOrder, status, from, to)
    }

    @UseGuards(AuthGuard())
    @Get("/book-mark-by-id")
    async getBookMarkById(
        @CurrentUser() user: any,
        @Query("id") id: string,
    ) {
        return await this.BookMarkServices.getBookMarkById(user , id)
    }
    
    @UseGuards(AuthGuard())
    @Delete("/delete")
    async deleteBookMarkById(
        @CurrentUser() user: any,
        @Query("_id") _id: string,
    ) {
        return await this.BookMarkServices.deleteBookMark(user ,_id)
    }
    
    @UseGuards(AuthGuard())
    @Post("/toggle-pinned-bookmark")
    async togglePinnedBookmark(
        @CurrentUser() user: any,
        @Query("_id") _id: string,
    ) {
        return await this.BookMarkServices.togglePinnedBookmark(user ,_id)
    }
    
    @UseGuards(AuthGuard())
    @Get("/get-pinned-details")
    async getPinnedDetails(
        @CurrentUser() user: any,
    ) {
        return await this.BookMarkServices.getPinnedDetails(user)
    }
    
}
