import { FileSystemService } from './file-system.service';
import { Body, Controller, Delete, Post, Req, UploadedFile, UseInterceptors, Query, Get, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';

@Controller('file-system')
export class FileSystemController {
    constructor(
        private readonly FileSystemService: FileSystemService,
    ) { }

    // @Post("/upload")
    // upload() {
    //     return this.FileSystemService.uploadFile("");
    // }

    @UseGuards(AuthGuard())
    @Post("/upload")
    @UseInterceptors(FileInterceptor('file', multerConfig))
    async uploadFileToLocal(
        @UploadedFile() file,
        @CurrentUser() user: any
    ) {
        console.log('File uploaded:', file);
        return await this.FileSystemService.uploadFile(user , file)
    }

    @UseGuards(AuthGuard())
    @Post("/upload-and-get-url")
    @UseInterceptors(FileInterceptor('file', multerConfig))
    async uploadFileAndGetUrl(
        @UploadedFile() file,
        @CurrentUser() user: any
    ) {
        console.log('File uploaded:', file);
        return await this.FileSystemService.uploadFileAndGetUrl(user, file)
    }

    @UseGuards(AuthGuard())
    @Delete("/delete")
    deleteImage(
        @Query("fileId") fileId: String,
        @CurrentUser() user: any
    ) {
        console.log(user);
        console.log(fileId);
        return this.FileSystemService.deleteFile(user , fileId);
    }

    @UseGuards(AuthGuard())
    @Get("/generate-public-url")
    generatePublicUrl(
        @Query("fileId") fileId: string,
        @CurrentUser() user: any
    ) {
        console.log(fileId);
        return this.FileSystemService.generatePublicUrl(user , fileId);
    }

    @UseGuards(AuthGuard())
    @Get()
    getFileLinkById(
        @Query("fileId") fileId: String,
        @CurrentUser() user: any
    ) {
        console.log(fileId);
        return this.FileSystemService.getFileLinkById(user , fileId);
    }

    @UseGuards(AuthGuard())
    @Post("/upload-video-base64-data")
    async uploadVideoBase64Data(
        @Body() body: any,
        @CurrentUser() user: any
    ) {
        return await this.FileSystemService.uploadVideoBase64Data(user , body);
    }

    @UseGuards(AuthGuard())
    @Post("/upload-Audio-base64-data")
    async uploadAudioBase64Data(
        @Body() body: any,
        @CurrentUser() user: any
    ) {
        return await this.FileSystemService.uploadAudioBase64Data(user , body);
    }
    
    @UseGuards(AuthGuard())
    @Post("/get-website-icon-from-link")
    async getwebsiteiconfromlink(
        @Body("link") link: string,
        @CurrentUser() user: any
    ) {
        return await this.FileSystemService.uploadGetOtherWebSiteIcoByLink(user , link);
    }

    // @Post("/resumableUploads")
    // resumableUploads(

    // ) {
    //     return this.FileSystemService.resumableUploads();
    // }
}
