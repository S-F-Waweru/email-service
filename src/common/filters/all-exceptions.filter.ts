import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorPayload {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string | string[];
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseObject =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : undefined;
    const rawMessage = responseObject?.message ?? exceptionResponse;
    const message =
      typeof rawMessage === 'string' ||
      (Array.isArray(rawMessage) &&
        rawMessage.every((item) => typeof item === 'string'))
        ? rawMessage
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : 'Request failed';
    const requestId = request.headers['x-request-id'];

    const payload: ErrorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      error:
        typeof responseObject?.error === 'string'
          ? responseObject.error
          : (HttpStatus[status] ?? 'Error'),
      message,
      ...(typeof requestId === 'string' ? { requestId } : {}),
    };

    if (status >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.originalUrl}`, stack);
    } else {
      this.logger.warn(`${request.method} ${request.originalUrl} ${status}`);
    }

    response.status(status).json(payload);
  }
}
