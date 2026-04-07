import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { StatusPageController } from './controller/status-page.controller';
import { StatusPageService } from './service/status-page.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StatusPageController],
  providers: [StatusPageService],
})
export class StatusPageModule {}