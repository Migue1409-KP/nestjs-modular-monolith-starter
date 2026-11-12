import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ApiSuccess } from '@/shared/interfaces/api-response';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId || 'no-request-id';

    return next.handle().pipe(
      map((data) => {
        // Si el handler ya devuelve ApiResponse, solo le añadimos el requestId si falta
        if (data && data.status && ['success', 'fail', 'error'].includes(data.status)) {
          return {
            ...data,
            requestId: data.requestId || requestId,
          } as ApiResponse<T>;
        }

        // Caso normal → envolvemos en success y añadimos requestId
        const response: ApiSuccess<T> = {
          status: 'success',
          data,
          requestId,
        };
        return response;
      }),
    );
  }
}
