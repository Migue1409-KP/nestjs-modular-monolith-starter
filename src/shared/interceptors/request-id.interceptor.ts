import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import { map } from 'rxjs/operators';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // 1. Generar un UUID único por request
    const requestId = randomUUID();

    // 2. Inyectar en el objeto request (disponible en controllers/services)
    request.requestId = requestId;

    // 3. También en la response headers
    // response.setHeader('X-Request-Id', requestId);

    // 4. Mapear la respuesta para añadir el requestId en el body (según tu ApiResponse)
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object') {
          return { ...data, requestId };
        }
        return data;
      }),
    );
  }
}
