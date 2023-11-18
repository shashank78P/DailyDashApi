import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskManagementModule } from './task-management/task-management.module';
import { TaskManagementController } from './task-management/task-management.controller';
import { TaskManagementService } from './task-management/task-management.service';
import { UsersModule } from './users/users.module';
import { LogInDetailsModule } from './log-in-devices/log-in-details.module';
import { MailServiceModule } from './mail-service/mail-service.module';
import { FileSystemModule } from './file-system/file-system.module';
import { PollsGateway } from './chats/polls.gateway';
import { corsMiddleware } from './middleware/cors.middleware'; // Import the middleware
import { ChatsModule } from './chats/chats.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MeetService } from './meet/meet.service';
import { MeetController } from './meet/meet.controller';
import { MeetsModule } from './meet/meet.module';
import { BookMarksModule } from './book-marks/book-marks.module';
import { QuickAccessModule } from './quick-access/quick-access.module';

// password
// KTnUhKukTZ9n1fhf

@Module({
  imports: [
    MongooseModule.forRoot(
      // "mongodb://localhost:27017/"
      "mongodb+srv://shashank:KTnUhKukTZ9n1fhf@atlascluster.hj3ipxu.mongodb.net/DailyDash?retryWrites=true&w=majority"
    ),
    TaskManagementModule,
    UsersModule,
    LogInDetailsModule,
    MailServiceModule,
    FileSystemModule,
    ChatsModule,
    MeetsModule,
    JwtModule.register(
      {
        secret: "DailyDash51",
        signOptions: {
          expiresIn: "1d",
        }
      }
    ),
    BookMarksModule,
    QuickAccessModule,
  ],
  controllers: [AppController, TaskManagementController ],
  providers: [AppService, TaskManagementService, PollsGateway, corsMiddleware ,JwtService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(corsMiddleware).forRoutes({ path: 'polls', method: RequestMethod.ALL });
  }
}
