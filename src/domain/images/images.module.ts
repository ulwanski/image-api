import { Module } from '@nestjs/common';
import { FileService } from './services/file.service';
import { ImageService } from './services/image.service';
import { ImageRepository } from './repository/image.repository';
import { ImagesController } from './controller/images.controller';
import { ImageConvertService } from './services/image-convert.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { StorageProvider } from '../../infrastructure/storage/storage.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [ImagesController],
  providers: [FileService, ImageService, ImageConvertService, ImageRepository, StorageProvider]
})
export class ImagesModule {}
