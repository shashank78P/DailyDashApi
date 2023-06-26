import { Body, Controller, Post, Req } from '@nestjs/common';
import { FileSystemService } from './file-system.service';

@Controller('file-system')
export class FileSystemController {
    constructor(
        private readonly FileSystemService: FileSystemService,
    ) { }

    @Post("/")
    async uploadFile(
        @Body() FileData,
        @Req() req
    ) {
        return this.FileSystemService.uploadFile(FileData, req)
    }
}
