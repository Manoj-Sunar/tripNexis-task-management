// src/tasks/dto/edit-task.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsDateString, IsUUID, IsNotEmpty } from 'class-validator';

import { CreateTaskDto } from './create-task.dto';
import { TaskPriority, TaskStatus } from './task.entity';

/**
 * EditTaskDTO
 * 
 * Used for updating a task. All fields are optional.
 * Admin can update everything; assigned user can update status only.
 */
export class EditTaskDto extends PartialType(CreateTaskDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Title cannot be empty' })
    title?: string;

    @IsOptional()
    description?: string;

    @IsOptional()
    @IsEnum(TaskStatus, { message: 'Status must be TODO, IN_PROGRESS, or DONE' })
    status?: TaskStatus;

    @IsOptional()
    @IsEnum(TaskPriority, { message: 'Priority must be LOW, MEDIUM, or HIGH' })
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
    dueDate?: string;

    @IsOptional()
    @IsUUID('4', { message: 'assignedToId must be a valid UUID' })
    assignedToId?: string; // Updated to UUID for production-level
}
