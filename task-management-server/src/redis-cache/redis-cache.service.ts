import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';


@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
    private redis: Redis;

    onModuleInit() {
        this.redis = new Redis({
            host: 'localhost',
            port: 6379
        });

        this.redis.on('connect', () => {
            console.log('Redis connected');
        });

        this.redis.on("error", (err) => {
            console.log("redis error", err)
        })
    }

    onModuleDestroy() {
        this.redis.quit();
    }


    // Set value (object, array, primitive)
    async set<T extends object | Array<any> | string | number | boolean>(
        key: string,
        value: T,
        expireSeconds?: number,
    ): Promise<void> {
        const stringValue = JSON.stringify(value);
        if (expireSeconds) {
            await this.redis.set(key, stringValue, 'EX', expireSeconds);
        } else {
            await this.redis.set(key, stringValue);
        }
    }

    // Get value (object, array, primitive)
    async get<T extends object | Array<any> | string | number | boolean>(
        key: string,
    ): Promise<T | null> {
        const value = await this.redis.get(key);
        return value ? (JSON.parse(value) as T) : null;
    }

    // Delete a key
    async del(key: string): Promise<number> {
        return await this.redis.del(key);
    }

    

    // Expose raw Redis client if needed
    getClient(): Redis {
        return this.redis;
    }


}
