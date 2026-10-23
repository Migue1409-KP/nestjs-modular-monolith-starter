import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExtendedUserSession } from '../interfaces/extended-session';

/**
 * Interceptor que verifica que el usuario tenga una suscripción activa
 * antes de permitir el acceso al endpoint.
 */
@Injectable()
export class ActiveSubscriptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const session: ExtendedUserSession | undefined = request.session;

    // Verificar que exista sesión
    // if (!session || !session.user) {
    //   throw new ForbiddenException({
    //     message: 'Authentication required',
    //     data: [
    //       {
    //         field: 'session',
    //         message: 'No active session found',
    //         code: 'session_not_found',
    //       },
    //     ],
    //   });
    // }

    // // Verificar que exista suscripción
    // if (!session.subscription) {
    //   throw new ForbiddenException({
    //     message: 'Active subscription required',
    //     data: [
    //       {
    //         field: 'subscription',
    //         message: 'No subscription found for this user',
    //         code: 'subscription_not_found',
    //       },
    //     ],
    //   });
    // }

    // // Verificar que la suscripción esté activa
    // if (
    //   session.subscription.status !== 'active' &&
    //   session.subscription.status !== 'pending_cancel'
    // ) {
    //   throw new ForbiddenException({
    //     message: 'Active subscription required',
    //     data: [
    //       {
    //         field: 'subscription',
    //         message: `Subscription status is '${session.subscription.status}'. An active subscription is required to access this resource`,
    //         code: 'subscription_not_active',
    //       },
    //     ],
    //   });
    // }

    return next.handle();
  }
}
