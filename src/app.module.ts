import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ImagesModule } from './domain/images/images.module';
import { StatusPageModule } from './domain/status-page/status-page.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ImagesModule,
    DatabaseModule,
    StatusPageModule,
  ],
})
export class AppModule {}