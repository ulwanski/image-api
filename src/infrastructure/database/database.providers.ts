import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export const DATABASE_POOL = Symbol('DATABASE_POOL');

export const databaseProviders = [
  {
    provide: DATABASE_POOL,
    inject: [ConfigService],
    useFactory: (config: ConfigService): Pool => {
      return new Pool({
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        user: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });
    },
  },
];