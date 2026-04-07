import { Module } from '@nestjs/common';
import { databaseProviders, DATABASE_POOL } from './database.providers';
import { DatabaseHealthService } from './database-health.service';

@Module({
  providers: [...databaseProviders, DatabaseHealthService],
  exports: [DATABASE_POOL, DatabaseHealthService],
})
export class DatabaseModule {}