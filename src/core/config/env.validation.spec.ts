import { validateEnv } from './env.validation';

const validEnv = () => ({
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'secret',
  DB_NAME: 'app',
  DATABASE_URL: 'postgres://postgres:secret@localhost:5432/app',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  MAGIC_LINK_SECRET: 'b'.repeat(32),
  API_KEY: 'c'.repeat(16),
  FRONTEND_URL: 'http://localhost:3001',
});

describe('validateEnv', () => {
  it('accepts a minimal development environment and coerces numbers', () => {
    const result = validateEnv({ ...validEnv(), PORT: '3000', PATH: '/usr/bin' });

    expect(result.DB_PORT).toBe(5432);
    expect(result.PORT).toBe(3000);
    expect(result.PATH).toBe('/usr/bin');
  });

  it('lists every missing required variable at once', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow(
      /DATABASE_URL[\s\S]*BETTER_AUTH_SECRET[\s\S]*MAGIC_LINK_SECRET[\s\S]*API_KEY/,
    );
  });

  it('treats the "..." placeholders of .env.example as missing', () => {
    expect(() => validateEnv({ ...validEnv(), BETTER_AUTH_SECRET: '...' })).toThrow(
      /BETTER_AUTH_SECRET is required/,
    );
  });

  it('rejects short secrets', () => {
    expect(() => validateEnv({ ...validEnv(), MAGIC_LINK_SECRET: 'short' })).toThrow(
      /MAGIC_LINK_SECRET must be at least 32 characters/,
    );
  });

  it('requires third-party integrations in production', () => {
    expect(() => validateEnv({ ...validEnv(), NODE_ENV: 'production' })).toThrow(
      /AWS_SES_SENDER is required when NODE_ENV=production[\s\S]*R2_BUCKET_NAME/,
    );
  });

  it('accepts production when every integration is configured', () => {
    const integrations = Object.fromEntries(
      [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_SES_SENDER',
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_URL',
      ].map((key) => [key, 'value']),
    );

    expect(() =>
      validateEnv({ ...validEnv(), NODE_ENV: 'production', ...integrations }),
    ).not.toThrow();
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...validEnv(), NODE_ENV: 'prod' })).toThrow(/NODE_ENV/);
  });
});
