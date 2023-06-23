import { Module } from '@nestjs/common';
import { TaskManagementService } from './task-management.service';
import { TaskManagementController } from './task-management.controller';

@Module({
  providers: [TaskManagementService],
  controllers: [TaskManagementController]
})
export class TaskManagementModule {}
