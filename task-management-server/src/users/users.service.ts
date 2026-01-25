import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { LoginDTO } from './login.dto';
import { UserDecorator } from 'src/auth/user.decorator';


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
        try {
            const { email, password } = loginDto;

            console.log(email, password);
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
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException(error);
        }
    }


    // get all user this service only for admin
    async getAllUser(
        search?: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
        try {
            // 1️⃣ Generate a cache key based on parameters
            const cacheKey = `users:search=${search || 'none'}:page=${page}:limit=${limit}`;

            // 2️⃣ Try to get from cache
            const cached = await this.cacheService.get<{ data: User[]; total: number; page: number; limit: number }>(cacheKey);
            if (cached) {
                console.log('Returning cached data');
                return cached;
            }

            // 3️⃣ Build query
            const query = this.userRepository.createQueryBuilder('user');
            if (search) {
                query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
                    search: `%${search}%`,
                });
            }

            // Pagination
            const skip = (page - 1) * limit;
            query.skip(skip).take(limit);

            // Ordering
            query.orderBy('user.name', 'ASC');

            // 4️⃣ Execute query
            const [data, total] = await query.getManyAndCount();

            const result = { data, total, page, limit };

            // 5️⃣ Cache result for 60 seconds
            await this.cacheService.set(cacheKey, result, 60); // TTL can be adjusted

            return result;

        } catch (err) {
            throw new InternalServerErrorException(`Failed to fetch users: ${err.message}`);
        }
    }


    // delete user this  service only for admin
    async deleteUser(id: string, currentUser: Partial<User>): Promise<{ message: string }> {
        try {


            // 1️⃣ Check if the current user is admin
            if (currentUser.role !== 'admin') {
                throw new UnauthorizedException('Only admin can delete users');
            }

            // 2️⃣ Find the user to delete
            const user = await this.userRepository.findOne({ where: { id: id } });
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


    // login user can get their own profile
    async LoginUserProfile(currentUser: { sub: string, name: string, email: string, role: string }) {
        try {

            const cachedUser = await this.cacheService.get(`user:${currentUser.email}`);

            if (!cachedUser) {
                const LoginUser = await this.userRepository.findOne({ where: { id: currentUser.sub } });

                if (!LoginUser) {
                    throw new UnauthorizedException("Unauthorized access");
                }

                return LoginUser;
            }

            return cachedUser;



        } catch (error) {
            throw new InternalServerErrorException(`Failed to delete user: ${error.message}`);
        }
    }



    // Login user can update his profile
    async loginUserEdit(
        userId: string,
        editData: Partial<User>,
        currentUser: { sub: string; name: string; email: string; role: string },
    ): Promise<Partial<User>> {
        try {
            // Only allow user to edit their own profile
            if (userId !== currentUser.sub) {
                throw new ForbiddenException('You can only update your own profile');
            }

            // Find user
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Prevent critical fields from being updated
            delete editData.role;
            delete editData.id;
            delete editData.createdAt;
            delete editData.updatedAt;

            // Check if email is being updated and is unique
            if (editData.email && editData.email !== user.email) {
                const existing = await this.userRepository.findOne({ where: { email: editData.email } });
                if (existing) {
                    throw new ConflictException('Email already in use');
                }
            }

            // Hash password if updated
            if (editData.password) {
                editData.password = await bcrypt.hash(editData.password, 10);
            }

            // Merge and save
            this.userRepository.merge(user, editData);
            const updatedUser = await this.userRepository.save(user);

            // Update cache
            const cacheKey = `user:${updatedUser.email}`;
            await this.cacheService.set(cacheKey, {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
            }, 3600);

            // Invalidate JWT cache if email changed
            if (editData.email && editData.email !== currentUser.email) {
                await this.cacheService.del(`token:${updatedUser.id}`);
            }

            // Invalidate cached admin lists
            const keys = await this.cacheService.getClient().keys('users:*');
            if (keys.length) await this.cacheService.getClient().del(keys);

            return {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
            };
        } catch (error) {
            if (error instanceof ForbiddenException ||
                error instanceof NotFoundException ||
                error instanceof ConflictException) {
                throw error;
            }
            console.error(error); // Optional internal logging
            throw new InternalServerErrorException(
                `Failed to update user profile: ${error.message}`,
            );
        }
    }



    async UpdateRole(
        id: string,
        role: string,
        currentUser: { sub: string; role: string },
    ): Promise<{ message: string; user: Partial<User> }> {
        try {

            console.log(role);

            // 1️⃣ Only admin can update roles
            if (currentUser.role !== 'admin') {
                throw new ForbiddenException('Only admin can update user roles');
            }



            // 2️⃣ Prevent admin from changing their own role
            if (currentUser.sub === id) {
                throw new BadRequestException('You cannot change your own role');
            }

            // 3️⃣ Validate allowed roles
            const allowedRoles = ['admin', 'user'];
            if (!allowedRoles.includes(role)) {
                throw new BadRequestException('Invalid role value');
            }

            // 4️⃣ Find user
            const user = await this.userRepository.findOne({ where: { id } });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            // 5️⃣ Skip update if role is already same
            if (user.role === role) {
                return {
                    message: 'User already has this role',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                };
            }

            // 6️⃣ Update role
            user.role = role;
            const updatedUser = await this.userRepository.save(user);

            // 7️⃣ Cache management
            // Update user cache
            await this.cacheService.set(
                `user:${updatedUser.email}`,
                {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                },
                3600,
            );

            // Invalidate token so user must re-login
            await this.cacheService.del(`token:${updatedUser.id}`);

            // Invalidate admin user lists cache
            const keys = await this.cacheService.getClient().keys('users:*');
            if (keys.length) {
                await this.cacheService.getClient().del(keys);
            }

            // 8️⃣ Return safe response
            return {
                message: 'User role updated successfully',
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                },
            };
        } catch (error) {
            if (
                error instanceof ForbiddenException ||
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }

            console.error('UpdateRole error:', error);

            throw new InternalServerErrorException(
                `Failed to update user role: ${error.message}`,
            );
        }
    }

}
