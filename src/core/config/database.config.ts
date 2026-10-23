import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { resolveDbSsl } from '@/core/database/ssl.util';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  // Deployed environments run migrations only — never synchronize.
  const isServerEnv = nodeEnv === 'production' || nodeEnv === 'staging';

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
    ssl: resolveDbSsl({
      DB_SSL: configService.get<string>('DB_SSL'),
      DB_SSL_REJECT_UNAUTHORIZED: configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
      DB_SSL_CA: configService.get<string>('DB_SSL_CA'),
    }),
  };
};
