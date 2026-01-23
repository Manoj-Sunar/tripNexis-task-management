import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from 'src/users/users.entity';
import { UsersModule } from 'src/users/users.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]), // ✅ Register repositories
    UsersModule, // ✅ Import UsersModule if you want to use UsersService
  
  ],
  controllers: [TaskController],
  providers: [TaskService]
})
export class TaskModule { }
