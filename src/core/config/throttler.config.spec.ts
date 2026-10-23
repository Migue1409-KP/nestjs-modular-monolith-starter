import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { AUTH_THROTTLER, DEFAULT_THROTTLER, getThrottlerConfig } from './throttler.config';

const contextFor = (path: string) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ path }) }) }) as unknown as ExecutionContext;

const bucket = (config: ReturnType<typeof getThrottlerConfig>, name: string) => {
  const list = Array.isArray(config) ? config : config.throttlers;
  return list.find((t) => t.name === name)!;
};

describe('getThrottlerConfig', () => {
  it('uses sane defaults with a stricter auth bucket', () => {
    const config = getThrottlerConfig(new ConfigService({}));

    expect(bucket(config, DEFAULT_THROTTLER)).toMatchObject({ ttl: 60_000, limit: 100 });
    expect(bucket(config, AUTH_THROTTLER)).toMatchObject({ ttl: 60_000, limit: 10 });
  });

  it('reads limits from the environment', () => {
    const config = getThrottlerConfig(
      new ConfigService({ THROTTLE_TTL_MS: 1000, THROTTLE_LIMIT: 5, THROTTLE_AUTH_LIMIT: 2 }),
    );

    expect(bucket(config, DEFAULT_THROTTLER)).toMatchObject({ ttl: 1000, limit: 5 });
    expect(bucket(config, AUTH_THROTTLER)).toMatchObject({ ttl: 1000, limit: 2 });
  });

  it('routes auth paths only to the auth bucket and the rest only to the default one', async () => {
    const config = getThrottlerConfig(new ConfigService({ API_PREFIX: 'api/v1' }));
    const defaultSkip = bucket(config, DEFAULT_THROTTLER).skipIf!;
    const authSkip = bucket(config, AUTH_THROTTLER).skipIf!;

    const authCtx = contextFor('/api/v1/auth/sign-in/magic-link');
    expect(await defaultSkip(authCtx)).toBe(true);
    expect(await authSkip(authCtx)).toBe(false);

    const usersCtx = contextFor('/api/v1/users');
    expect(await defaultSkip(usersCtx)).toBe(false);
    expect(await authSkip(usersCtx)).toBe(true);

    // A look-alike prefix must not be treated as an auth route.
    expect(await authSkip(contextFor('/api/v1/authors'))).toBe(true);
  });
});
