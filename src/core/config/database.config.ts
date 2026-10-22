import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  // Deployed environments run migrations only — never synchronize.
  const isServerEnv = nodeEnv === 'production' || nodeEnv === 'staging';
  // SSL depends on the database provider, not on NODE_ENV: opt in with DB_SSL=true.
  const useSsl = configService.get<string>('DB_SSL') === 'true';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'password'),
    database: configService.get<string>('DB_NAME', 'nestjs_template'),
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    // __dirname-relative so it resolves both under ts-node (src/) and compiled (dist/)
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: !isServerEnv,
    logging: nodeEnv === 'development',
    // Migrations are applied explicitly (`npm run migration:run:prod`), e.g. as a
    // pre-deploy command, not on app boot.
    migrationsRun: false,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
};
