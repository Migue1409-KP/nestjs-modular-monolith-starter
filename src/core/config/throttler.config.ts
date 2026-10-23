import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const AUTH_THROTTLER = 'auth';
export const DEFAULT_THROTTLER = 'default';

/**
 * Two buckets per client: a general one and a much stricter one for the Better Auth
 * endpoints (sign-in, magic link...), which are the brute-force / email-bombing targets.
 * Each bucket skips the other's routes, so a request is only counted once.
 */
export const getThrottlerConfig = (configService: ConfigService): ThrottlerModuleOptions => {
  const authPath = `/${configService.get<string>('API_PREFIX', 'api/v1')}/auth`;
  const ttl = configService.get<number>('THROTTLE_TTL_MS', 60_000);

  const isAuthRoute = (context: ExecutionContext): boolean => {
    const path: string = context.switchToHttp().getRequest().path ?? '';
    return path === authPath || path.startsWith(`${authPath}/`);
  };

  return {
    throttlers: [
      {
        name: DEFAULT_THROTTLER,
        ttl,
        limit: configService.get<number>('THROTTLE_LIMIT', 100),
        skipIf: isAuthRoute,
      },
      {
        name: AUTH_THROTTLER,
        ttl,
        limit: configService.get<number>('THROTTLE_AUTH_LIMIT', 10),
        skipIf: (context) => !isAuthRoute(context),
      },
    ],
  };
};
