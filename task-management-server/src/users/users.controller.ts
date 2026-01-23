import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { createUserDTO } from './user.dto';
import { UsersService } from './users.service';
import { LoginDTO } from './login.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserDecorator } from 'src/auth/user.decorator';

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


    // ✝️ get all users by admin
    @UseGuards(AuthGuard, new RolesGuard(['admin']))
    @Get('all-users')
    async AllUsers(@Query('search') search?: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10) {
        return this.usersService.getAllUser(search, page, limit);
    }


    @UseGuards(AuthGuard, new RolesGuard(['admin']))
    @Delete('user-delete/:id')
    // ☑️ users are only delete by admin
    async delete(@Param('id') id: string, @UserDecorator() currentUser: { id: string, name: string, email: string, role: string }) {
        const result = await this.usersService.deleteUser(id, currentUser);

        return {
            statusCode: 200,
            message: result.message,
        }

    }

}
