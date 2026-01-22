import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { LoginDTO } from './login.dto';

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


    async userLogin(
        loginDto: LoginDTO,
    ): Promise<{ user: Partial<User>; token: string }> {
        const { email, password } = loginDto;

        if (!password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 1️⃣ Always fetch password from DB
        const dbUser = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'name', 'email', 'password'],
        });

        if (!dbUser) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 2️⃣ Always validate password
        const isPasswordValid = await bcrypt.compare(
            password,
            dbUser.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 3️⃣ Cache user profile (NO PASSWORD)
        const cacheKey = `user:${email}`;
        const cachedUser = await this.cacheService.get(cacheKey);

        if (!cachedUser) {
            await this.cacheService.set(
                cacheKey,
                {
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email,
                },
                3600,
            );
        }

        // 4️⃣ Generate JWT
        const payload = { sub: dbUser.id, email: dbUser.email };
        const token = this.jwtService.sign(payload);

        return {
            user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
            },
            token,
        };
    }



}
