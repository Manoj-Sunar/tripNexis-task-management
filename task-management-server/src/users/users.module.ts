import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { Task } from 'src/task/task.entity';



@Module({
  imports: [TypeOrmModule.forFeature([User,Task]),
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'secretKey',
    signOptions: { 'expiresIn': '1d' },
  })
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule { }
