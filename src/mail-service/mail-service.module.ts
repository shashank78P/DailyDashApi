import { Module } from '@nestjs/common';
import { MailServiceController } from './mail-service.controller';
import { MailServiceService } from './mail-service.service';

@Module({
  controllers: [MailServiceController],
  providers: [MailServiceService]
})
export class MailServiceModule {}
