import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/users.entity';
import { CreateTaskDto } from './create-task.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

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
        const { assignedToId, title, description, status, priority, dueDate } = createTaskDto;

        if (!title || !description) {
            throw new BadRequestException('Title and description are required');
        }

        // Find assigned user if provided
        let assignedUser: User | null = null;
        if (assignedToId) {
            assignedUser = await this.usersRepository.findOne({ where: { id: assignedToId } });
            if (!assignedUser) {
                throw new NotFoundException('Assigned user not found');
            }
        }

        // Prepare task data
        const taskData: Partial<Task> = {
            title,
            description,
            status: status || TaskStatus.TODO,
            priority: priority || TaskPriority.MEDIUM,
            createdBy: currentUser,
        };

        if (dueDate) {
            taskData.dueDate = new Date(dueDate);
        }

        if (assignedUser) {
            taskData.assignedTo = assignedUser;
        }

        // Create and save task
        const task = this.tasksRepository.create(taskData);
        const savedTask = await this.tasksRepository.save(task);

        // Invalidate Redis cache for this user
        const cacheKey = `tasks:user:${currentUser.id}`;
        await this.cacheService.del(cacheKey);

        return savedTask;
    }


}
