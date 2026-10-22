import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError, ProblemDetails } from '@/shared/interfaces/api-response';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let problem: ProblemDetails;
    let status: number;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      problem = {
        type: 'about:blank',
        title: HttpStatus[status] || 'Unknown Error',
        status,
        detail: typeof r === 'string' ? r : (r as any).message,
        instance: request.url,
        ...(typeof r !== 'string' &&
          ((r as any).data?.length > 0 || (r as any).errors?.length > 0) && {
            errors: (r as any).data || (r as any).errors,
          }),
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      problem = {
        type: 'about:blank',
        title: 'Internal Server Error',
        status,
        // Never leak raw driver/internal error messages (e.g. Postgres syntax errors) to clients in production.
        // The real message is always logged below regardless of environment.
        detail:
          process.env.NODE_ENV === 'production'
            ? 'Unexpected error'
            : (exception as any)?.message || 'Unexpected error',
        instance: request.url,
      };
    }

    // Log del error (funcionalidad traída de AllExceptionsFilter)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : 'Unknown error',
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${problem.detail}`);
    }

    const errorResponse: ApiError = {
      status: 'error',
      error: problem,
      requestId: request.headers['x-request-id'] as string,
    };

    response.status(status).json(errorResponse);
  }
}
