import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AUTH_CLIENT_SERVICE } from '../src/shared/guards/policy.guard';
import { ApiKeyGuard } from '../src/shared/guards/api-key.guard';
import { ZodValidationPipe } from '../src/shared/pipes/zod-validation.pipe';
import { ProblemDetailsFilter } from '../src/shared/filters/problem-details.filter';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { RequestIdInterceptor } from '../src/shared/interceptors/request-id.interceptor';

/**
 * Boots the REAL AppModule (TypeORM + Postgres, Better Auth, PolicyGuard + YAML policies,
 * ApiKeyGuard, throttler, interceptors, filters). Only the session lookup is replaced:
 * the `x-test-roles` header makes PolicyGuard see a logged-in user with those roles.
 *
 * Needs a reachable Postgres with the schema applied (DATABASE_URL / DB_* from `.env`
 * or the environment). Without DATABASE_URL the suite is skipped.
 */
const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

const fakeAuthClient = {
  instance: {
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const roles = headers.get('x-test-roles');
        if (!roles) return null;
        return {
          user: {
            id: 'e2e-user-id',
            email: 'e2e@example.com',
            roles: roles.split(',').filter(Boolean),
          },
          session: { id: 'e2e-session-id' },
        };
      },
    },
  },
};

describeWithDb('Real app (e2e)', () => {
  let app: INestApplication;
  const apiKey = process.env.API_KEY as string;

  const get = (path: string) => request(app.getHttpServer()).get(`/api/v1${path}`);
  const asRole = (path: string, roles: string) =>
    get(path).set('api-key', apiKey).set('x-test-roles', roles);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AUTH_CLIENT_SERVICE)
      .useValue(fakeAuthClient)
      .compile();

    // Mirrors the global setup of src/main.ts.
    app = moduleRef.createNestApplication({ bodyParser: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new RequestIdInterceptor(), new ResponseInterceptor());
    app.useGlobalGuards(new ApiKeyGuard(app.get(ConfigService), app.get(Reflector)));
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new ProblemDetailsFilter());
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  describe('health', () => {
    it('is public and reports the database as up', async () => {
      const res = await get('/health').expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' });
    });
  });

  describe('ApiKeyGuard', () => {
    it('rejects protected routes without an api-key', async () => {
      const res = await get('/parameters/languages').set('x-test-roles', 'USER').expect(401);

      expect(res.body.status).toBe('error');
    });

    it('rejects a wrong api-key', async () => {
      await get('/parameters/languages')
        .set('api-key', 'wrong-key')
        .set('x-test-roles', 'USER')
        .expect(401);
    });
  });

  describe('PolicyGuard + RBAC matrix', () => {
    it('returns 401 when there is a valid api-key but no session', async () => {
      await get('/parameters/languages').set('api-key', apiKey).expect(401);
    });

    it('returns 403 for a session without roles', async () => {
      // A header with only a comma yields an empty roles array.
      await asRole('/parameters/languages', ',').expect(403);
    });

    it('lets a USER read the languages catalog from the database', async () => {
      const res = await asRole('/parameters/languages', 'USER').expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('denies a USER on an ADMIN-only resource', async () => {
      await asRole('/notifications', 'USER').expect(403);
    });

    it('lets an ADMIN through the same resource', async () => {
      const res = await asRole('/notifications', 'ADMIN').expect(200);

      expect(res.body.status).toBe('success');
    });

    it('applies the union of roles for multi-role users', async () => {
      await asRole('/notifications', 'USER,ADMIN').expect(200);
    });

    it('does not authorize methods missing from the matrix', async () => {
      // POST /notifications exists, but only ADMIN's wildcard policy covers it.
      await request(app.getHttpServer())
        .post('/api/v1/notifications')
        .set('api-key', apiKey)
        .set('x-test-roles', 'USER')
        .send({})
        .expect(403);
    });
  });

  describe('Zod validation + Problem Details', () => {
    it('answers 400 with the error envelope on an invalid body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/profile')
        .set('api-key', apiKey)
        .set('x-test-roles', 'USER')
        .send({ unexpected: true })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.error).toHaveProperty('status', 400);
    });
  });

  describe('Better Auth mounting', () => {
    it('serves the real Better Auth handler under the API prefix', async () => {
      const res = await get('/auth/ok').set('api-key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ok: true });
    });
  });
});
