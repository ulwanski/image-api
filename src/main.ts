import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { runMigrations } from './infrastructure/database/migrations.js';

(async function bootstrap(): Promise<void> {
  await runMigrations(__dirname);
  const app: INestApplication = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8080);
})();