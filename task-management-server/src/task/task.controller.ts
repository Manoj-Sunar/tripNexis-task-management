import { Body, Controller, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateTaskDto } from './create-task.dto';

import { RolesGuard } from 'src/auth/roles.guard';
import { UserDecorator } from 'src/auth/user.decorator';
import { User } from 'src/users/users.entity';

@Controller('task')
export class TaskController {
    constructor(private readonly taskService: TaskService) { }


    @UseGuards(AuthGuard, new RolesGuard(["user", "admin"]))
    @Post("create-task")
    async createTask(@Body() createTaskDto: CreateTaskDto, @UserDecorator() currentUser: User) {
        if (!currentUser) throw new UnauthorizedException('You must be logged in to create tasks');

        const task = await this.taskService.createTask(createTaskDto, currentUser);

        return {
            statusCode: 201,
            message: 'Task created successfully',
            task,
        };
    }
}
