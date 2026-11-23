import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();

    let requestId = request.headers['x-request-id'] as string;
    if (!requestId) {
      requestId = 'req_' + uuidv4().replace(/-/g, '').substring(0, 16);
      request.headers['x-request-id'] = requestId;
    }

    reply.header('X-Request-Id', requestId);

    return next.handle().pipe(
      tap(() => {
        reply.header('X-Request-Id', requestId);
      })
    );
  }
}
