// update-role.dto.ts
import { IsIn, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsIn(['admin', 'user'], { message: 'Role must be admin or user' })
  role: string;
}
