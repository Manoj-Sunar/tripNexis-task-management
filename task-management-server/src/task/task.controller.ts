import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateTaskDto } from './create-task.dto';

import { RolesGuard } from 'src/auth/roles.guard';
import { UserDecorator } from 'src/auth/user.decorator';
import { User } from 'src/users/users.entity';
import { TaskStatus } from './task.entity';

@Controller('task')
export class TaskController {
    constructor(private readonly taskService: TaskService) { }



    // only admin can create task and assign
    @UseGuards(AuthGuard, new RolesGuard(["admin"]))
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



    // only admin can get all tasks
    @UseGuards(AuthGuard, new RolesGuard(["admin"]))
    @Get("/get-alltask")
    async AllTaskForAdmin(@Query('search') search?: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10) {
        return this.taskService.getAllTask(search, page, limit);
    }


    //   only login user or admin can get there assign task admin can get all task
    @UseGuards(AuthGuard, new RolesGuard(['user', 'admin']))
    @Get('/user-assign-task/:id')

    async userGetTheirAssignTask(
        @Param('id', ParseUUIDPipe) id: string,
        @UserDecorator() currentUser: {
            sub: string;
            name: string;
            email: string;
            role: string;
        },
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: TaskStatus,

    ) {


        // user can only access their own tasks unless admin
        if (currentUser.role !== 'admin' && currentUser.sub !== id) {
            throw new ForbiddenException(
                'You are not allowed to access these tasks',
            );
        }

        return this.taskService.userGetTheirAssignTask(id, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            status,

        });
    }


    // only admin can delete task
    @UseGuards(AuthGuard, new RolesGuard(["admin"]))
    @Delete("/delete-task/:id")
    async DeleteTask(@Param('id', ParseUUIDPipe) id: string, @UserDecorator() currentUser: { id: string, name: string, email: string, role: string }) {

        if (currentUser.role !== 'admin') {
            throw new ForbiddenException("You are Unable to delete task");
        }

        return this.taskService.DeleteTask(id);
    }







}
