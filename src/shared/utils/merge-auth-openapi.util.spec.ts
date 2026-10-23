import type { OpenAPIObject } from '@nestjs/swagger';
import { mergeAuthOpenApi } from './merge-auth-openapi.util';

const nestDocument = (): OpenAPIObject => ({
  openapi: '3.0.0',
  info: { title: 'API', version: '1' },
  paths: { '/api/v1/users': { get: { responses: {} } } },
  components: { schemas: { User: { type: 'object' } }, securitySchemes: { cookieAuth: {} as any } },
});

const authSchema = {
  security: [{ apiKeyCookie: [] }],
  tags: [{ name: 'Default', description: 'Core endpoints' }],
  components: {
    schemas: { Session: { type: 'object' }, User: { type: 'string' } },
    securitySchemes: { apiKeyCookie: { type: 'apiKey' } },
  },
  paths: {
    '/sign-in/email': { post: { tags: ['Default'], responses: {} } },
    '/magic-link/verify': { get: { tags: ['Magic-link'], security: [], responses: {} } },
  },
};

describe('mergeAuthOpenApi', () => {
  it('re-roots Better Auth paths under the auth base path', () => {
    const doc = mergeAuthOpenApi(nestDocument(), authSchema, '/api/v1/auth/');
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        '/api/v1/users',
        '/api/v1/auth/sign-in/email',
        '/api/v1/auth/magic-link/verify',
      ]),
    );
  });

  it('prefixes tags, keeps descriptions and inherits the default security', () => {
    const doc = mergeAuthOpenApi(nestDocument(), authSchema, 'api/v1/auth');
    const op = doc.paths['/api/v1/auth/sign-in/email'].post;
    expect(op.tags).toEqual(['Better Auth - Default']);
    expect(op.security).toEqual([{ apiKeyCookie: [] }]);
    expect(doc.paths['/api/v1/auth/magic-link/verify'].get.security).toEqual([]);
    expect(doc.tags).toContainEqual({
      name: 'Better Auth - Default',
      description: 'Core endpoints',
    });
  });

  it('merges components without overriding Nest entries', () => {
    const doc = mergeAuthOpenApi(nestDocument(), authSchema, 'api/v1/auth');
    expect(doc.components.schemas.User).toEqual({ type: 'object' });
    expect(doc.components.schemas.Session).toBeDefined();
    expect(Object.keys(doc.components.securitySchemes)).toEqual(
      expect.arrayContaining(['cookieAuth', 'apiKeyCookie']),
    );
  });

  it('returns the document untouched when there is no schema', () => {
    const doc = nestDocument();
    expect(mergeAuthOpenApi(doc, undefined, 'api/v1/auth')).toBe(doc);
    expect(Object.keys(doc.paths)).toEqual(['/api/v1/users']);
  });
});
