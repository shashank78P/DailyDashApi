import { Controller, Get } from '@nestjs/common';
import { TaskManagementService } from './task-management.service';
import { TaskManagement } from './taskManagement-model';

@Controller('task-management')
export class TaskManagementController {
    // constructor(private taskManagementService: TaskManagementService) { }
    // @Get()
    // getAllTasks(): TaskManagement[] {
    //     return this.taskManagementService.getAllTasks();
    // }
}
