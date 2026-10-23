import * as express from 'express';
import * as request from 'supertest';
import { createSecurityHeadersMiddleware } from './security-headers.util';

describe('createSecurityHeadersMiddleware', () => {
  const app = express();
  app.use(createSecurityHeadersMiddleware('/api/v1/docs'));
  app.get('/api/v1/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/v1/docs', (_req, res) => res.send('docs'));

  it('sets hardening headers and a CSP on regular routes', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('keeps the other headers but drops the CSP on the docs page', async () => {
    const res = await request(app).get('/api/v1/docs').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeUndefined();
  });
});
