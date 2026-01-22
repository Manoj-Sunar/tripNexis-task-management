import { Body, Controller, Post } from '@nestjs/common';
import { createUserDTO } from './user.dto';
import { UsersService } from './users.service';
import { LoginDTO } from './login.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register')
    async register(@Body() createUserDto: createUserDTO) {
        const result = await this.usersService.userRegistration(createUserDto);
        return {
            statusCode: 201,
            message: 'User registered successfully',
            data: result,
        };
    }

    @Post('login')
    async Login(@Body() loginDto: LoginDTO) {
        const result = await this.usersService.userLogin(loginDto);
        return {
            statusCode: 201,
            message: 'User Login Successfully ☑️',
            data: result,
        }
    }
}
