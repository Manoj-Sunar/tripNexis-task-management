import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { createUserDTO } from './user.dto';
import { UsersService } from './users.service';
import { LoginDTO } from './login.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserDecorator } from 'src/auth/user.decorator';
import { EditUserDto } from './user-edit-dto';
import { UpdateRoleDto } from './update-role.dto';

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


    //Login user profile 
    @UseGuards(AuthGuard, new RolesGuard(['user', 'admin']))
    @Get('user-profile')
    async LoginProfile(@UserDecorator() currentUser: { sub: string, name: string, email: string, role: string }) {
        console.log(currentUser)
        if (!currentUser) {
            throw new UnauthorizedException("Unauthorized access");
        }

        return this.usersService.LoginUserProfile(currentUser);
    }


    // Login user can update their own profile
    @UseGuards(AuthGuard, new RolesGuard(['user', 'admin']))
    @Patch('login-user-edit/:id')
    async loginUserEdit(
        @Param('id') id: string,
        @Body() editData: EditUserDto,
        @UserDecorator() currentUser: { sub: string; name: string; email: string; role: string },
    ) {
        const updatedUser = await this.usersService.loginUserEdit(id, editData, currentUser);
        return { message: 'Profile updated successfully', user: updatedUser };
    }


    // Login user can update their own profile
    @UseGuards(AuthGuard, new RolesGuard(['admin']))
    @Patch('role-update/:id')

    async RoleUpdate(@Param("id", ParseUUIDPipe) id: string, @Body() body:UpdateRoleDto, @UserDecorator() currentUser: { sub: string, role: string }) {

        if (!currentUser) {
            throw new UnauthorizedException("You need to login");
        }

        if (currentUser.role !== 'admin') {
            throw new ForbiddenException("You are not able to change role");
        }

        return this.usersService.UpdateRole(id, body.role, currentUser);
    }



}
