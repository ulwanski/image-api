import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { runMigrations } from './infrastructure/database/migrations.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './application/filters/all-exceptions.filter';

(async function bootstrap(): Promise<void> {
  await runMigrations(__dirname);
  const app: INestApplication = await NestFactory.create(AppModule);

  const docs = new DocumentBuilder()
    .setTitle('Images API')
    .setDescription('API for uploading and serving images.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, docs);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(process.env.PORT ?? 8080);
})();