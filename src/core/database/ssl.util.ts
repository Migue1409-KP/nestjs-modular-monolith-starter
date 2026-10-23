export interface DbSslOptions {
  rejectUnauthorized: boolean;
  ca?: string;
}

export interface DbSslEnv {
  DB_SSL?: string;
  DB_SSL_REJECT_UNAUTHORIZED?: string;
  DB_SSL_CA?: string;
}

/**
 * SSL options shared by the app (`database.config.ts`) and the TypeORM CLI (`data-source.ts`).
 *
 * SSL depends on the database provider, not on NODE_ENV: opt in with DB_SSL=true.
 * The server certificate is verified by default; set DB_SSL_CA (PEM, `\n` allowed) for a
 * private CA, and only as a last resort DB_SSL_REJECT_UNAUTHORIZED=false.
 */
export function resolveDbSsl(env: DbSslEnv): DbSslOptions | false {
  if (env.DB_SSL !== 'true') return false;

  const ca = env.DB_SSL_CA?.trim() ? env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;

  return {
    rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(ca && { ca }),
  };
}
