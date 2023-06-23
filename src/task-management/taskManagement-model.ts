export interface TaskManagement {
    id: string,
    title: string,
    description: string,
    status: TaskStatus
}

export enum TaskStatus {
    NOT_STARTED = "NOT STARTED",
    IN_PROGRESS = "IN PROGRESS",
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR",
}