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

    @Post()
    @UseInterceptors(FileInterceptor('file', multerConfig))
    uploadFileToLocal(@UploadedFile() file) {
        console.log('File uploaded:', file);
        const { originalname, mimetype, size, filename } = file;
        return this.FileSystemService.uploadFile(originalname, mimetype, size, filename);
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
        @Query("fileId") fileId: String
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

    // @Post("/resumableUploads")
    // resumableUploads(

    // ) {
    //     return this.FileSystemService.resumableUploads();
    // }
}
