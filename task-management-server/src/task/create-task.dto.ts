// src/tasks/dto/create-task.dto.ts
import { IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskPriority, TaskStatus } from './task.entity';


export class CreateTaskDto {
    @IsNotEmpty({message:'Title is required'})
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

    @IsOptional()
    assignedToId?: number; // User ID to assign the task
}
