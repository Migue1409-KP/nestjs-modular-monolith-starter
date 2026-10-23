/**
 * Runs before every e2e suite (jest `setupFiles`), i.e. before AppModule is imported.
 *
 * - DB credentials come from the developer's `.env` (or the CI environment).
 * - Everything else is pinned here so the real AppModule boots deterministically.
 *   `process.env` wins over `.env` in ConfigModule, so these overrides are authoritative.
 *
 * NODE_ENV=staging on purpose: it keeps TypeORM `synchronize` off, so the e2e suite never
 * alters the schema of the database it points to (migrations own the schema).
 */
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

Object.assign(process.env, {
  NODE_ENV: 'staging',
  API_PREFIX: 'api/v1',
  FRONTEND_URL: 'http://localhost:3001',
  API_KEY: 'e2e-api-key-0123456789',
  BETTER_AUTH_SECRET: 'e2e-better-auth-secret-0123456789abcdef',
  MAGIC_LINK_SECRET: 'e2e-magic-link-secret-0123456789abcdef',
  // Rate limits high enough not to interfere with the suites.
  THROTTLE_LIMIT: '10000',
  THROTTLE_AUTH_LIMIT: '10000',
  // Dummy third-party credentials: the SDK clients are built but never called.
  GOOGLE_CLIENT_ID: 'e2e',
  GOOGLE_CLIENT_SECRET: 'e2e',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'e2e',
  AWS_SECRET_ACCESS_KEY: 'e2e',
  AWS_SES_SENDER: 'e2e@example.com',
  R2_ACCOUNT_ID: 'e2e',
  R2_ACCESS_KEY_ID: 'e2e',
  R2_SECRET_ACCESS_KEY: 'e2e',
  R2_BUCKET_NAME: 'e2e',
  R2_PUBLIC_URL: 'https://example.com',
});
