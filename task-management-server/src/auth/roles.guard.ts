import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Observable } from "rxjs";


export class RolesGuard implements CanActivate {
    constructor(
        private allowedRoles: string[],
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const request = context.switchToHttp().getRequest();
        const user = request.user;
    

        if (!user) {
            throw new ForbiddenException('No user found in request');
        }

        const hasRole = this.allowedRoles.includes(user.role);


        if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}