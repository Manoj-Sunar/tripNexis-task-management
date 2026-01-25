import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { TaskModule } from './task/task.module';
import { RedisCacheModule } from './redis-cache/redis-cache.module';
import { JwtGlobalModule } from './auth/auth.module';






@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ REQUIRED
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }, // 👈 REQUIRED
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsersModule,
    TaskModule,
    RedisCacheModule,
    JwtGlobalModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
