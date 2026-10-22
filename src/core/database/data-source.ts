import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// SSL depends on the database provider, not on NODE_ENV: opt in with DB_SSL=true.
const useSsl = process.env.DB_SSL === 'true';

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
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});
