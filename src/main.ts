import { NestFactory } from '@nestjs/core';
import { ImagesModule } from './domain/images/images.module';

(async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ImagesModule);
  await app.listen(process.env.PORT ?? 8080);
})();