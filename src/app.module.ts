import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskManagementModule } from './task-management/task-management.module';
import { TaskManagementController } from './task-management/task-management.controller';
import { TaskManagementService } from './task-management/task-management.service';
import { UsersModule } from './users/users.module';
import { LogInDevicesModule } from './log-in-devices/log-in-devices.module';
import { MailServiceModule } from './mail-service/mail-service.module';

// password
// KTnUhKukTZ9n1fhf

@Module({
  imports: [
    MongooseModule.forRoot(
      "mongodb+srv://shashank:KTnUhKukTZ9n1fhf@atlascluster.hj3ipxu.mongodb.net/DailyDash?retryWrites=true&w=majority"
    ),
    TaskManagementModule,
    UsersModule,
    LogInDevicesModule,
    MailServiceModule
  ],
  controllers: [AppController, TaskManagementController],
  providers: [AppService, TaskManagementService],
})
export class AppModule { }
