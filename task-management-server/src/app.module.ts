import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { TaskModule } from './task/task.module';
import { RedisCacheService } from './redis-cache/redis-cache.service';
import { RedisCacheModule } from './redis-cache/redis-cache.module';





@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ REQUIRED
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    TaskModule,
    RedisCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
