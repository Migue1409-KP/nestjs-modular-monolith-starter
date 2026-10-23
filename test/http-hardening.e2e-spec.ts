import { Test } from '@nestjs/testing';
import { Controller, Get, INestApplication, Module, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { getThrottlerConfig } from '../src/core/config/throttler.config';
import { createSecurityHeadersMiddleware } from '../src/shared/utils/security-headers.util';

// Same wiring as AppModule (global ThrottlerGuard + getThrottlerConfig) with stub routes,
// so no database or Better Auth instance is needed.
@Controller()
class StubController {
  @Get('ping')
  ping() {
    return { ok: true };
  }

  @Post('auth/sign-in/magic-link')
  signIn() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () =>
        getThrottlerConfig(
          new ConfigService({
            API_PREFIX: 'api/v1',
            THROTTLE_LIMIT: 3,
            THROTTLE_AUTH_LIMIT: 2,
            THROTTLE_TTL_MS: 60_000,
          }),
        ),
    }),
  ],
  controllers: [StubController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class HardeningTestModule {}

describe('HTTP hardening (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HardeningTestModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(createSecurityHeadersMiddleware('/api/v1/docs'));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends security headers and hides x-powered-by', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/ping').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('returns 429 after the auth bucket is exhausted, independently of the default one', async () => {
    const server = app.getHttpServer();
    const signIn = () => request(server).post('/api/v1/auth/sign-in/magic-link');

    await signIn().expect(201);
    await signIn().expect(201);
    await signIn().expect(429);

    // The default bucket is untouched by the auth requests above.
    await request(server).get('/api/v1/ping').expect(200);
  });

  it('returns 429 once the default bucket is exhausted', async () => {
    const server = app.getHttpServer();

    // One default request was already spent in the previous tests (ping x2 overall).
    await request(server).get('/api/v1/ping').expect(200);
    await request(server).get('/api/v1/ping').expect(429);
  });
});
