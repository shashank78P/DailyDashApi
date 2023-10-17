import { FileSystemService } from './file-system.service';
import { Body, Controller, Delete, Post, Req, UploadedFile, UseInterceptors, Query, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';

@Controller('file-system')
export class FileSystemController {
    constructor(
        private readonly FileSystemService: FileSystemService,
    ) { }

    // @Post("/upload")
    // upload() {
    //     return this.FileSystemService.uploadFile("");
    // }

    @Post("/upload")
    @UseInterceptors(FileInterceptor('file', multerConfig))
    async uploadFileToLocal(
        @UploadedFile() file,
    ) {
        console.log('File uploaded:', file);
        return await this.FileSystemService.uploadFile(file)
    }
    
    @Post("/upload-and-get-url")
    @UseInterceptors(FileInterceptor('file', multerConfig))
    async uploadFileAndGetUrl(
        @UploadedFile() file,
    ) {
        console.log('File uploaded:', file);
        return await  this.FileSystemService.uploadFileAndGetUrl(file)
    }

    @Delete()
    deleteImage(
        @Query("fileId") fileId: String
    ) {
        console.log(fileId);
        return this.FileSystemService.deleteFile(fileId);
    }

    @Get("/generate-public-url")
    generatePublicUrl(
        @Query("fileId") fileId: string
    ) {
        console.log(fileId);
        return this.FileSystemService.generatePublicUrl(fileId);
    }
    @Get()
    getFileLinkById(
        @Query("fileId") fileId: String
    ) {
        console.log(fileId);
        return this.FileSystemService.getFileLinkById(fileId);
    }
    
    @Post("/upload-video-base64-data")
    async uploadVideoBase64Data(
        @Body() body: any
    ) {
        return await this.FileSystemService.uploadVideoBase64Data(body);
    }
    
    @Post("/upload-Audio-base64-data")
    async uploadAudioBase64Data(
        @Body() body: any
    ) {
        return await this.FileSystemService.uploadAudioBase64Data(body);
    }

    // @Post("/resumableUploads")
    // resumableUploads(

    // ) {
    //     return this.FileSystemService.resumableUploads();
    // }
}
