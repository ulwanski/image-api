import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import { FileService } from './file.service';
import { StorageService } from '../../../application/interfaces/storage.interface';

describe('FileService', (): void => {
  let service: FileService;
  let storage: jest.Mocked<StorageService>;

  const fakeBuffer: Buffer = Buffer.from('fake-image-data');
  const fakeHash: string = createHash('sha256').update(fakeBuffer).digest('hex');
  const expectedDir: string = `${fakeHash.slice(0, 2)}/${fakeHash.slice(2, 4)}/${fakeHash.slice(4, 6)}`;
  const expectedPath: string = `${expectedDir}/${fakeHash}.jpg`;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: 'StorageService',
          useValue: {
            put: jest.fn().mockResolvedValue(expectedPath),
            get: jest.fn().mockResolvedValue(fakeBuffer),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(FileService);
    storage = module.get('StorageService');
  });

  describe('put', (): void => {
    it('should generate hash-based path and delegate to storage', async (): Promise<void> => {
      const result: string = await service.put(fakeBuffer, 'photo.jpg');

      expect(storage.put).toHaveBeenCalledWith(fakeBuffer, expectedPath);
      expect(result).toBe(expectedPath);
    });

    it('should preserve original file extension', async (): Promise<void> => {
      await service.put(fakeBuffer, 'image.png');

      const calledPath = storage.put.mock.calls[0][1];
      expect(calledPath.endsWith('.png')).toBe(true);
    });

    it('should produce same path for identical content', async (): Promise<void> => {
      await service.put(fakeBuffer, 'a.jpg');
      await service.put(fakeBuffer, 'b.jpg');

      const path1 = storage.put.mock.calls[0][1];
      const path2 = storage.put.mock.calls[1][1];
      expect(path1).toBe(path2);
    });

    it('should produce different path for different content', async (): Promise<void> => {
      const otherBuffer: Buffer = Buffer.from('other-data');
      storage.put.mockResolvedValue('other/path.jpg');

      await service.put(fakeBuffer, 'a.jpg');
      await service.put(otherBuffer, 'a.jpg');

      const path1 = storage.put.mock.calls[0][1];
      const path2 = storage.put.mock.calls[1][1];
      expect(path1).not.toBe(path2);
    });
  });

  describe('get', (): void => {
    it('should delegate to storage and return buffer', async (): Promise<void> => {
      const result: Buffer | null = await service.get('some/path.jpg');

      expect(storage.get).toHaveBeenCalledWith('some/path.jpg');
      expect(result).toEqual(fakeBuffer);
    });

    it('should return null when file not found', async (): Promise<void> => {
      storage.get.mockResolvedValue(null);

      const result: Buffer | null = await service.get('missing.jpg');

      expect(result).toBeNull();
    });
  });

  describe('delete', (): void => {
    it('should delegate to storage', async (): Promise<void> => {
      await service.delete('some/path.jpg');

      expect(storage.delete).toHaveBeenCalledWith('some/path.jpg');
    });
  });
});