import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException, UseGuards } from '@nestjs/common';
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


    // user registration
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
            const payload = { sub: user.id, email: user.email, role: user.role };

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



    // user login
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
            select: ['id', 'name', 'email', 'password', 'role'],
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
        const payload = { sub: dbUser.id, email: dbUser.email, role: dbUser.role };

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


    // admin can get all user



    async getAllUser(
        search?: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
        try {
            const query = this.userRepository.createQueryBuilder('user');

            // 2️⃣ Apply search by name or email (case-insensitive)
            if (search) {
                query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
                    search: `%${search}%`,
                });
            }

            // 3️⃣ Pagination
            const skip = (page - 1) * limit;
            query.skip(skip).take(limit);

            // 4️⃣ Order results
            query.orderBy('user.name', 'ASC');

            // 5️⃣ Execute query
            const [data, total] = await query.getManyAndCount();

            return { data, total, page, limit };

        } catch (err) {
            throw new InternalServerErrorException(`Failed to fetch users: ${err.message}`);
        }
    }



    async deleteUser(id: string, currentUser: Partial<User>): Promise<{ message: string }> {
        try {

            const currentId = Number(id);
            // 1️⃣ Check if the current user is admin
            if (currentUser.role !== 'admin') {
                throw new UnauthorizedException('Only admin can delete users');
            }

            // 2️⃣ Find the user to delete
            const user = await this.userRepository.findOne({ where: { id: currentId } });
            if (!user) {
                throw new InternalServerErrorException('User not found');
            }

            // 3️⃣ Delete the user from DB
            await this.userRepository.delete(id);

            // 4️⃣ Remove user and token from cache
            await this.cacheService.del(`user:${user.email}`);
            await this.cacheService.del(`token:${user.id}`);

            return { message: 'User deleted successfully' };
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new InternalServerErrorException(`Failed to delete user: ${error.message}`);
        }
    }


}
