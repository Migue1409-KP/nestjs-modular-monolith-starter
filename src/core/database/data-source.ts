import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolveDbSsl } from './ssl.util';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'nestjs_template',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  // __dirname-relative so it resolves both under ts-node (src/) and compiled (dist/)
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: resolveDbSsl({
    DB_SSL: process.env.DB_SSL,
    DB_SSL_REJECT_UNAUTHORIZED: process.env.DB_SSL_REJECT_UNAUTHORIZED,
    DB_SSL_CA: process.env.DB_SSL_CA,
  }),
});
