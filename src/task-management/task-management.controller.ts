import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { TaskManagementService } from './task-management.service';
import { TaskManagement } from './taskManagement-model';

@Controller('task-management')
@UsePipes(ValidationPipe)
export class TaskManagementController {
    // constructor(private taskManagementService: TaskManagementService) { }
    // @Get()
    // getAllTasks(): TaskManagement[] {
    //     return this.taskManagementService.getAllTasks();
    // }
}
