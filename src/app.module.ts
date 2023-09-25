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
import { SocketModule } from './socket/socket.module';
import { PollsGateway } from './socket/polls.gateway';
import { SocketController } from './socket/socket.controller';
import { SocketService } from './socket/socket.service';
import { corsMiddleware } from './middleware/cors.middleware'; // Import the middleware

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
    SocketModule
  ],
  controllers: [AppController, TaskManagementController, SocketController],
  providers: [AppService, TaskManagementService, PollsGateway, SocketService, corsMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(corsMiddleware).forRoutes({ path: 'polls', method: RequestMethod.ALL });
  }
}
