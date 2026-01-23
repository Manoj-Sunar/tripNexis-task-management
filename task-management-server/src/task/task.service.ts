import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { DeepPartial, Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { CreateTaskDto } from './create-task.dto';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { UserDecorator } from 'src/auth/user.decorator';
import { EditTaskDto } from './edit-task.dto';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        private readonly cacheService: RedisCacheService,
    ) { }


    // create task asssign to user only by admin

    async createTask(createTaskDto: CreateTaskDto, currentUser: User): Promise<Task> {
        const { title, description, status, priority, dueDate, assignedToId } = createTaskDto;

        if (!title?.trim()) throw new BadRequestException('Task title is required');

        // Fetch authenticated user entity from DB
        const user = await this.usersRepository.findOne({ where: { id: currentUser.id } });
        if (!user) throw new NotFoundException('Authenticated user not found');

        // Fetch assigned user if provided
        let assignedUser: User | null = null;
        if (assignedToId) {
            assignedUser = await this.usersRepository.findOne({ where: { id: assignedToId.toString() } });
            if (!assignedUser) throw new NotFoundException('Assigned user not found');
        }

        // Create task entity
        const task: Task = this.tasksRepository.create({
            title,
            description,
            status: status || TaskStatus.TODO,
            priority: priority || TaskPriority.MEDIUM,
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: user,
            assignedTo: assignedUser,
        } as DeepPartial<Task>);

        const savedTask: Task = await this.tasksRepository.save(task);

        // saved in cache 
        await this.cacheService.set(`task:${task.id}`, task, 3600);

        // Invalidate Redis cache for this user
        await this.cacheService.del(`tasks:user:${user.id}`);

        return savedTask;
    }



    // this is only for admin
    async getAllTask(search?: string,
        page: number = 1,
        limit: number = 10): Promise<{ data: Task[]; total: number; page: number; limit: number }> {


        try {
            const query = this.tasksRepository.createQueryBuilder('task');

            // 2️⃣ Apply search by name or email (case-insensitive)
            if (search) {
                query.andWhere('(task.title ILIKE :search)', {
                    search: `%${search}%`,
                });
            }

            // 3️⃣ Pagination
            const skip = (page - 1) * limit;
            query.skip(skip).take(limit);

            // 4️⃣ Order results
            query.orderBy('task.title', 'ASC');

            // 5️⃣ Execute query
            const [data, total] = await query.getManyAndCount();

            return { data, total, page, limit };
        } catch (error) {
            throw new InternalServerErrorException(`Failed to fetch users: ${error.message}`);
        }

    }


    //   only login user or admin can get there assign task admin can get all task
    async userGetTheirAssignTask(
        userId: string,
        options?: {
            page?: number;
            limit?: number;
            status?: TaskStatus;
        },
    ) {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;

        try {
            const [tasks, total] = await this.tasksRepository.findAndCount({
                where: {
                    assignedTo: { id: userId },
                    ...(options?.status && { status: options.status }),
                },
                order: { createdAt: 'DESC' },
                skip,
                take: limit,
            });

            return {
                message: 'Assigned tasks fetched successfully',
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                data: tasks,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to fetch assigned tasks',
            );
        }
    }


    // this is only for admin 
    async DeleteTask(id: string) {
        try {
            const task = await this.tasksRepository.findOne({ where: { id: id } })
            if (!task) {
                throw new NotFoundException("task is not found");
            }

            await this.cacheService.del(`task:${task.id}`);

            await this.tasksRepository.remove(task);

            return {
                message: 'Task deleted successfully',
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to delete task',
            );
        }
    }


    // update status only admin and crrent login user has change his own assign task not others
    async updateTaskStatus(id: string, status: TaskStatus, @UserDecorator() currentUser: { sub: string, role: string }) {



        const task = await this.tasksRepository.findOne({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');



        if (currentUser.role !== 'admin' && task.assignedTo?.id !== currentUser.sub) {
            throw new ForbiddenException('You cannot update this task');
        }

        task.status = status;
        const updatedStatusTask = await this.tasksRepository.save(task);
        await this.cacheService.del(`task:${task.id}`);
        await this.cacheService.set(`task:${updatedStatusTask.id}`, updatedStatusTask);
        return updatedStatusTask;
    }


    // get task by id
    async getTaskById(id: string) {
        try {

            const catchedTask = await this.cacheService.get(`task:${id}`);

            if (!catchedTask) {
                const Task = await this.tasksRepository.findOne({ where: { id } });
                if (!Task) {
                    throw new NotFoundException("Task is not Found");
                }

                return Task;
            }

            return catchedTask;

        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to delete task',
            );
        }
    }




    // only admin can update task this service is only for admin
    async updateTaskById(
        id: string,
        updatedData: EditTaskDto,
        currentUser: { id: string; role: string }, // assume you pass current user info
    ): Promise<{ message: string; task: any }> {
        try {
            // 0️⃣ Authorization check: only admin
            if (currentUser.role !== 'admin') {
                throw new ForbiddenException('Only admin can update tasks');
            }

            // 1️⃣ Find existing task with relations
            const task = await this.tasksRepository.findOne({
                where: { id },
                relations: ['assignedTo', 'createdBy'],
            });
            if (!task) {
                throw new NotFoundException('Task not found');
            }

            // 2️⃣ Update fields selectively
            if (updatedData.title !== undefined) task.title = updatedData.title.trim();
            if (updatedData.description !== undefined)
                task.description = updatedData.description.trim();
            if (updatedData.status !== undefined) task.status = updatedData.status;
            if (updatedData.priority !== undefined) task.priority = updatedData.priority;
            if (updatedData.dueDate !== undefined) {
                const due = new Date(updatedData.dueDate);
                if (isNaN(due.getTime())) throw new BadRequestException('Invalid dueDate');
                task.dueDate = due;
            }

            // 3️⃣ Update assigned user if provided
            if (updatedData.assignedToId !== undefined) {
                if (updatedData.assignedToId === null) {
                    task.assignedTo = null; // unassign user
                } else {
                    const assignedUser = await this.usersRepository.findOne({
                        where: { id: updatedData.assignedToId },
                    });
                    if (!assignedUser) {
                        throw new NotFoundException('Assigned user not found');
                    }
                    task.assignedTo = assignedUser;
                }
            }



            // 5️⃣ Save updated task in DB
            const updatedTask = await this.tasksRepository.save(task);

            // 6️⃣ Cache management
            // Invalidate single task cache
            await this.cacheService.del(`task:${task.id}`);
            await this.cacheService.set(`task:${task.id}`, updatedTask, 3600);

            // Invalidate user-specific task cache if assigned user changed
            if (task.assignedTo) {
                await this.cacheService.del(`tasks:user:${task.assignedTo.id}`);
            }

            // Optionally, invalidate all tasks list cache for admins
            const keys = await this.cacheService.getClient().keys('tasks:admin:*');
            if (keys.length) await this.cacheService.getClient().del(keys);

            // 7️⃣ Return updated task
            return {
                message: 'Task updated successfully',
                task: updatedTask,
            };
        } catch (error) {
            // Log internally for debugging
            console.error('updateTaskById error:', error);

            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            )
                throw error;

            throw new InternalServerErrorException(
                `Failed to update task: ${error.message}`,
            );
        }
    }


}





