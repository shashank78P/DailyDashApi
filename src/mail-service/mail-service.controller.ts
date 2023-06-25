import { Controller, Get, Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { MailServiceService } from './mail-service.service';

@Controller('mail-service')
@UsePipes(ValidationPipe)
export class MailServiceController {
    constructor(
        private readonly mailService: MailServiceService,
    ) { }

    @Get()
    async getTemplate() {
        // return await this.mailService.()
    }

}
