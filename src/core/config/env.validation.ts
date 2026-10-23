import { z } from 'zod';

// Treat empty strings and the "..." placeholders from .env.example as "not set".
const isPlaceholder = (value: unknown) =>
  typeof value === 'string' && (value.trim() === '' || value.trim() === '...');

const emptyToUndefined = (value: unknown) => (isPlaceholder(value) ? undefined : value);

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const requiredString = (name: string) =>
  z.preprocess(
    emptyToUndefined,
    z.string({ required_error: `${name} is required` }).min(1, `${name} is required`),
  );
const secret = (name: string, minLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string({ required_error: `${name} is required` })
      .min(minLength, `${name} must be at least ${minLength} characters`),
  );
const booleanString = z.preprocess(emptyToUndefined, z.enum(['true', 'false']).optional());
const port = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).optional());

const baseSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'staging', 'production']).default('development'),
  ),
  PORT: port,
  API_PREFIX: optionalString,
  HOST: optionalString,
  DOMAIN: optionalString,
  COOKIE_CROSS_SITE: booleanString,
  LOG_LEVEL: optionalString,
  // Reverse-proxy hops (or "true" / an IP list) so rate limiting sees the real client IP.
  TRUST_PROXY: optionalString,
  BODY_LIMIT: optionalString,
  THROTTLE_TTL_MS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  THROTTLE_LIMIT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  THROTTLE_AUTH_LIMIT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),

  DB_HOST: requiredString('DB_HOST'),
  DB_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535)),
  DB_USERNAME: requiredString('DB_USERNAME'),
  DB_PASSWORD: requiredString('DB_PASSWORD'),
  DB_NAME: requiredString('DB_NAME'),
  DB_SSL: booleanString,
  DATABASE_URL: requiredString('DATABASE_URL'),

  BETTER_AUTH_SECRET: secret('BETTER_AUTH_SECRET', 32),
  BETTER_AUTH_URL: optionalString,
  MAGIC_LINK_SECRET: secret('MAGIC_LINK_SECRET', 32),
  MAGIC_LINK_TOKEN_LENGTH: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().max(44).optional(),
  ),

  API_KEY: secret('API_KEY', 16),
  FRONTEND_URL: requiredString('FRONTEND_URL'),
  LANDING_PAGE_URL: optionalString,

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  AWS_REGION: optionalString,
  AWS_ACCESS_KEY_ID: optionalString,
  AWS_SECRET_ACCESS_KEY: optionalString,
  AWS_SES_SENDER: optionalString,

  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_PUBLIC_URL: optionalString,
  R2_PRESIGN_EXPIRES_IN: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
});

// Third-party integrations are only mandatory where they are really used.
const DEPLOYED_REQUIRED_KEYS = [
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
] as const;

const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'staging') return;
  for (const key of DEPLOYED_REQUIRED_KEYS) {
    if (!env[key]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required when NODE_ENV=${env.NODE_ENV}`,
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * `ConfigModule.forRoot({ validate })` hook: fails the bootstrap with every
 * invalid/missing variable listed at once instead of failing later at first use.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  // Keep unknown vars (OS/PATH...) and override the ones we parsed (coerced/defaulted).
  const parsed = Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined),
  );
  return { ...config, ...parsed };
}
