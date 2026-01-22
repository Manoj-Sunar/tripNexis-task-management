import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly cacheService: RedisCacheService,
    ) { }

    async userRegistration(userData: Partial<User>): Promise<{ user: Partial<User>, token: string }> {
        try {
            const { name, email, password } = userData;

            if (!password) {
                throw new InternalServerErrorException('Password is missing');
            }

            // 1️⃣ Check cache first
            const cachedUser = await this.cacheService.get<User>(`user:${email}`);
            if (cachedUser) {
                throw new ConflictException('Email already registered');
            }

            // 2️⃣ Check database as fallback
            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw new ConflictException('Email already registered');
            }

            // 3️⃣ Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4️⃣ Save user in DB
            const user = this.userRepository.create({ name, email, password: hashedPassword });
            await this.userRepository.save(user);

            // 5️⃣ Cache user in Redis
            await this.cacheService.set(`user:${email}`, { id: user.id, name: user.name, email: user.email }, 3600);

            // 6️⃣ Generate JWT
            const payload = { sub: user.id, email: user.email };
            const token = this.jwtService.sign(payload);

            // Optional: cache JWT
            await this.cacheService.set(`token:${user.id}`, token, 3600);

            return {
                user: { id: user.id, name: user.name, email: user.email },
                token
            };
        } catch (error) {
            if (error instanceof ConflictException) throw error;
            throw new InternalServerErrorException('Registration failed');
        }
    };


    async

}
