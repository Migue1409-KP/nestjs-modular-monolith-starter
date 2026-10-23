import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { AuthConfigFactory } from './auth-config.factory';

jest.mock('better-auth', () => ({ betterAuth: jest.fn((options) => options) }));
jest.mock('better-auth/plugins', () => ({
  customSession: jest.fn(),
  magicLink: jest.fn((options) => options),
  openAPI: jest.fn(),
}));
jest.mock('pg', () => ({ Pool: jest.fn() }));

const buildFactory = (env: Record<string, unknown>) => {
  const configService = new ConfigService(env);
  return new AuthConfigFactory({} as never, configService, {} as never);
};

describe('AuthConfigFactory', () => {
  const baseEnv = {
    BETTER_AUTH_SECRET: 'auth-secret-'.repeat(3),
    MAGIC_LINK_SECRET: 'magic-secret-'.repeat(3),
    DATABASE_URL: 'postgres://localhost/test',
    FRONTEND_URL: 'http://localhost:3001',
  };

  beforeEach(() => jest.clearAllMocks());

  it('passes the configured secret to Better Auth', () => {
    buildFactory(baseEnv).create();

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({ secret: baseEnv.BETTER_AUTH_SECRET }),
    );
  });

  it.each(['BETTER_AUTH_SECRET', 'MAGIC_LINK_SECRET'])('throws when %s is missing', (key) => {
    const env: Record<string, unknown> = { ...baseEnv };
    delete env[key];

    expect(() => buildFactory(env).create()).toThrow(key);
    expect(betterAuth).not.toHaveBeenCalled();
  });

  it('generates magic link tokens honoring MAGIC_LINK_TOKEN_LENGTH', async () => {
    buildFactory({ ...baseEnv, MAGIC_LINK_TOKEN_LENGTH: 12 }).create();
    const { generateToken } = (magicLink as jest.Mock).mock.calls[0][0];

    const token = await generateToken('user@example.com');

    expect(token).toMatch(/^[a-zA-Z0-9]{12}$/);
  });
});
