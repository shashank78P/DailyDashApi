import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskManagementModule } from './task-management/task-management.module';
import { TaskManagementController } from './task-management/task-management.controller';
import { TaskManagementService } from './task-management/task-management.service';

@Module({
  imports: [TaskManagementModule],
  controllers: [AppController, TaskManagementController],
  providers: [AppService, TaskManagementService],
})
export class AppModule { }
