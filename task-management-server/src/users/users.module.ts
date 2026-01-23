import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { Task } from 'src/task/task.entity';
import { JwtGlobalModule } from 'src/auth/auth.module';



@Module({
  imports: [TypeOrmModule.forFeature([User,Task]),
  JwtGlobalModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule { }
