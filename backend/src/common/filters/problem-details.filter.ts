import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected server error occurred';
    let code = 'INTERNAL_ERROR';
    let extraData: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'string') {
        detail = res;
      } else if (typeof res === 'object' && res !== null) {
        detail = res.message || res.detail || exception.message;
        code = res.code || this.statusToCode(status);
        title = res.error || res.title || this.statusToTitle(status);
        if (Array.isArray(res.message)) {
          detail = res.message.join('; ');
          extraData = { errors: res.message };
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    const requestId = (request.headers['x-request-id'] as string) || 'req-' + Date.now();

    const problemDetails: Record<string, any> = {
      type: `https://api.vivoquest.in/errors/${code.toLowerCase()}`,
      title,
      status,
      code,
      detail,
      instance: request.url,
      requestId,
      timestamp: new Date().toISOString()
    };

    if (extraData) {
      Object.assign(problemDetails, extraData);
    }

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .header('X-Request-Id', requestId)
      .send(problemDetails);
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST: return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED: return 'AUTH_UNAUTHORIZED';
      case HttpStatus.FORBIDDEN: return 'AUTH_FORBIDDEN';
      case HttpStatus.NOT_FOUND: return 'NOT_FOUND';
      case HttpStatus.CONFLICT: return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS: return 'RATE_LIMIT_EXCEEDED';
      default: return 'SERVER_ERROR';
    }
  }

  private statusToTitle(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST: return 'Bad Request';
      case HttpStatus.UNAUTHORIZED: return 'Unauthorized';
      case HttpStatus.FORBIDDEN: return 'Forbidden';
      case HttpStatus.NOT_FOUND: return 'Not Found';
      case HttpStatus.CONFLICT: return 'Conflict';
      case HttpStatus.TOO_MANY_REQUESTS: return 'Too Many Requests';
      default: return 'Internal Server Error';
    }
  }
}
