import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { DeepPartial, Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { CreateTaskDto } from './create-task.dto';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        private readonly cacheService: RedisCacheService,
    ) { }


    async createTask(createTaskDto: CreateTaskDto, currentUser: User): Promise<Task> {
        const { title, description, status, priority, dueDate, assignedToId } = createTaskDto;

        if (!title?.trim()) throw new BadRequestException('Task title is required');

        // Fetch authenticated user entity from DB
        const user = await this.usersRepository.findOne({ where: { id: currentUser.id } });
        if (!user) throw new NotFoundException('Authenticated user not found');

        // Fetch assigned user if provided
        let assignedUser: User | null = null;
        if (assignedToId) {
            assignedUser = await this.usersRepository.findOne({ where: { id: assignedToId } });
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

        // Invalidate Redis cache for this user
        await this.cacheService.del(`tasks:user:${user.id}`);

        return savedTask;
    }


}
