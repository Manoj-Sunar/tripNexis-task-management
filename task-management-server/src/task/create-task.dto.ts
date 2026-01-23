// src/tasks/dto/create-task.dto.ts
import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from './task.entity';


export class CreateTaskDto {
    @IsNotEmpty({ message: 'Title is required' })
    title: string;

    @IsOptional()
    description?: string;

    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsUUID('4', { message: 'assignedToId must be a valid UUID' })
    assignedToId?: string; // Updated to UUID for production-level
}
