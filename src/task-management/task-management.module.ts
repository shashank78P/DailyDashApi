import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskManagementService } from './task-management.service';
import { TaskManagementController } from './task-management.controller';
// import { TaskManagementSchema } from './schema/task-management.schema';

@Module({
  /*
  here we are making, injectable with the help of mongoose 
  now we can inject it into the file where we want to work with it 
   */
  // imports: [MongooseModule.forFeature([{ name: "TaskManagement", schema: TaskManagementSchema }])],
  providers: [TaskManagementService],
  controllers: [TaskManagementController]
})
export class TaskManagementModule { }
