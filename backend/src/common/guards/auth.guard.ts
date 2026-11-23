import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import { DatabaseService } from '../database/database.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET || 'vivoquest_production_jwt_secret_key_2026';

  constructor(
    private readonly reflector: Reflector,
    private readonly dbService: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_MISSING',
        detail: 'Authorization Bearer JWT token is required'
      });
    }

    const token = authHeader.substring(7).trim();

    try {
      const decoded: any = jwt.verify(token, this.jwtSecret);
      
      // Check session revocation in iam_sessions
      if (decoded.sessionId) {
        const session = await this.dbService.getCollection('iam_sessions').findOne({
          _id: new ObjectId(decoded.sessionId),
          revokedAt: null
        });

        if (!session) {
          throw new UnauthorizedException({
            code: 'AUTH_SESSION_REVOKED',
            detail: 'The session has been revoked or expired'
          });
        }
      }

      // Populate user info on request
      request.user = {
        id: decoded.sub,
        userId: decoded.sub,
        phoneHash: decoded.phoneHash,
        roles: decoded.roles || [],
        currentRole: decoded.currentRole || (decoded.roles && decoded.roles[0]) || 'patient',
        city: decoded.city || 'Pune',
        sessionId: decoded.sessionId
      };

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        detail: err.message || 'Invalid or expired access token'
      });
    }
  }
}
