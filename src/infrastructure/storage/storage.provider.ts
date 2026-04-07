import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { StorageService } from '../../application/interfaces/storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';

/**
 * Factory provider that creates the appropriate StorageService implementation
 * based on the `STORAGE_DRIVER` environment variable.
 *
 * Supported drivers:
 * - `local` — stores files on the local filesystem
 * - `s3` — stores files in an S3-compatible bucket (e.g. MinIO, AWS S3)
 */
export const StorageProvider: Provider = {
  provide: 'StorageService',
  inject: [ConfigService],
  useFactory: (config: ConfigService): StorageService => {
    const driver: string = config.get<string>('STORAGE_DRIVER', 'local');
    switch (driver) {
      case 's3':
        return new S3StorageService(config);

      case 'local':
        return new LocalStorageService(config);

        default:
          throw new Error(`Unknown storage driver: "${driver}"`);
    }
  },
};