import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dbService: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        detail: 'User context not found'
      });
    }

    // Role check
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles: string[] = user.roles || [];
      const hasRole = requiredRoles.some(r => userRoles.includes(r) || user.currentRole === r || userRoles.includes('admin'));
      if (!hasRole) {
        throw new ForbiddenException({
          code: 'AUTH_INSUFFICIENT_ROLE',
          detail: `User does not possess required role: ${requiredRoles.join(', ')}`
        });
      }
    }

    // Permission check
    if (requiredPermissions && requiredPermissions.length > 0) {
      const currentRole = user.currentRole || 'patient';
      if (currentRole === 'admin') {
        return true; // Admin has all permissions
      }

      const roleDoc = await this.dbService.getCollection('iam_roles').findOne({ key: currentRole });
      const grantedPermissions: string[] = roleDoc?.permissions || [];

      const hasPerm = requiredPermissions.every(p => grantedPermissions.includes(p));
      if (!hasPerm) {
        throw new ForbiddenException({
          code: 'AUTH_INSUFFICIENT_PERMISSION',
          detail: `Permission required: ${requiredPermissions.join(', ')}`
        });
      }
    }

    return true;
  }
}
