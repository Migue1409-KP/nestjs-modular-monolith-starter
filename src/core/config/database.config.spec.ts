import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';

const configFor = (values: Record<string, unknown>) =>
  ({
    get: (key: string, fallback?: unknown) => (key in values ? values[key] : fallback),
  }) as unknown as ConfigService;

describe('getDatabaseConfig', () => {
  it('reads the connection from the environment', () => {
    const config: any = getDatabaseConfig(
      configFor({
        DB_HOST: 'db.internal',
        DB_PORT: 6543,
        DB_USERNAME: 'app',
        DB_PASSWORD: 'pw',
        DB_NAME: 'appdb',
      }),
    );

    expect(config).toMatchObject({
      type: 'postgres',
      host: 'db.internal',
      port: 6543,
      username: 'app',
      password: 'pw',
      database: 'appdb',
      migrationsRun: false,
    });
  });

  it('synchronizes the schema only outside deployed environments', () => {
    expect((getDatabaseConfig(configFor({ NODE_ENV: 'development' })) as any).synchronize).toBe(
      true,
    );
    expect((getDatabaseConfig(configFor({ NODE_ENV: 'test' })) as any).synchronize).toBe(true);
    expect((getDatabaseConfig(configFor({ NODE_ENV: 'staging' })) as any).synchronize).toBe(false);
    expect((getDatabaseConfig(configFor({ NODE_ENV: 'production' })) as any).synchronize).toBe(
      false,
    );
  });

  it('only logs queries in development', () => {
    expect((getDatabaseConfig(configFor({ NODE_ENV: 'development' })) as any).logging).toBe(true);
    expect((getDatabaseConfig(configFor({ NODE_ENV: 'production' })) as any).logging).toBe(false);
  });

  it('delegates TLS settings to resolveDbSsl', () => {
    const config: any = getDatabaseConfig(configFor({ DB_SSL: 'true' }));
    expect(config.ssl).toMatchObject({ rejectUnauthorized: true });
  });
});
