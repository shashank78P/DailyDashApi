import { Injectable } from '@nestjs/common';
import { TaskManagement } from './taskManagement-model';

@Injectable()
export class TaskManagementService {
    private tasks: TaskManagement[] = [];

    getAllTasks(): TaskManagement[] {
        return this.tasks;
    }
}
