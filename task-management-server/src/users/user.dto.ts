import { IsEmail, isNotEmpty, IsNotEmpty, IsString, MinLength } from "class-validator";


export class createUserDTO{
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name:string;

    @IsString()
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email:string

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @IsNotEmpty({ message: 'Password is required' })
    password:string
}