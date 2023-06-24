import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { TaskManagement } from './taskManagement-model';
import { TaskManagementModule } from './task-management.module';
import { Model } from "mongoose"

@Injectable()
export class TaskManagementService {

    // constructor(@InjectModel("TaskManagement") private readonly Model ) {

    // }
}
