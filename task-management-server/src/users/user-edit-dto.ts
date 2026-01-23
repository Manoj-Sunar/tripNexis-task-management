import { PartialType } from "@nestjs/mapped-types";
import { createUserDTO } from "./user.dto";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class EditUserDto extends PartialType(createUserDTO) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsEmail({}, { message: 'Invalid email address' })
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @IsOptional()
    password?: string;
}
