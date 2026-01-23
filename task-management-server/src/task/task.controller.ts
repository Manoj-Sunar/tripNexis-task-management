import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateTaskDto } from './create-task.dto';

import { RolesGuard } from 'src/auth/roles.guard';
import { UserDecorator } from 'src/auth/user.decorator';
import { User } from 'src/users/users.entity';
import { TaskStatus } from './task.entity';
import { EditTaskDto } from './edit-task.dto';

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


    // // update status only admin and crrent login user has change his own assign task not others
    @UseGuards(AuthGuard, new RolesGuard(['user', 'admin']))
    @Patch('/update-status/:id')
    async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: TaskStatus, @UserDecorator() currentUser: { sub: string, role: string }) {

        return this.taskService.updateTaskStatus(id, status, currentUser);
    }



    // get task by id
    @UseGuards(AuthGuard, new RolesGuard(['admin']))
    @Get("taskBy-id/:id")
    async TaskByID(@Param('id', ParseUUIDPipe) id: string, @UserDecorator() currentUser: { sub: string, role: string }) {

        if (!currentUser) {
            throw new UnauthorizedException("you need to login first");
        }

        if (currentUser.role !== 'admin') {
            throw new ForbiddenException("you are not able to get this data");
        }
        return this.taskService.getTaskById(id);
    }



    // only admin can update task (this route only for admin)
    @UseGuards(AuthGuard, new RolesGuard(['admin']))
    @Patch("update-task/:id")
    async UpdateTask(@Param('id', ParseUUIDPipe) id: string, @Body() updatedData: EditTaskDto, @UserDecorator() currentUser: { sub: string, role: string }) {

        if (!currentUser) {
            throw new UnauthorizedException("you need to login first");
        }

        if (currentUser.role !== 'admin') {
            throw new ForbiddenException('you are unable to update task');
        }

        return this.taskService.UpdateTaskById(id,updatedData);
    }





}
