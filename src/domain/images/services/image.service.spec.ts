import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImageService } from './image.service';
import { FileService } from './file.service';
import { ImageConvertService } from './image-convert.service';
import { ImageRecord, ImageRepository } from '../repository/image.repository';
import { UploadImageInput } from '../../../application/dto/upload-image.input';
import { ImageResponseDto } from '../../../application/dto/image-response.dto';
import { PaginatedResponseDto } from '../../../application/dto/paginated-response.dto';

describe('ImageService', (): void => {
  let service: ImageService;
  let fileService: jest.Mocked<FileService>;
  let imageRepository: jest.Mocked<ImageRepository>;

  const mockRecord: ImageRecord = {
    id: 1,
    path: 'ab/cd/ef/abc123.jpg',
    type: 'image/jpeg',
    title: 'Test',
    width: 800,
    height: 600,
    created_at: new Date('2025-01-01'),
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: FileService,
          useValue: {
            put: jest.fn().mockResolvedValue('ab/cd/ef/abc123.jpg'),
            get: jest.fn().mockResolvedValue(Buffer.from('fake')),
          },
        },
        {
          provide: ImageRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockRecord),
            findById: jest.fn().mockResolvedValue(mockRecord),
            findAll: jest.fn().mockResolvedValue({ rows: [mockRecord], total: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get(ImageService);
    fileService = module.get(FileService);
    imageRepository = module.get(ImageRepository);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('store', (): void => {
    const input: UploadImageInput = {
      buffer: Buffer.from('fake-image'),
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      title: 'Test',
    };

    beforeEach((): void => {
      jest.spyOn(ImageConvertService, 'GetMetadata').mockResolvedValue({
        width: 800,
        height: 600,
        mimeType: 'image/jpeg',
      });
      jest.spyOn(ImageConvertService, 'Resize').mockResolvedValue(Buffer.from('resized'));
    });

    it('should store image without resizing when no target dimensions', async (): Promise<void> => {
      const result: ImageResponseDto = await service.store(input);

      expect(fileService.put).toHaveBeenCalledWith(input.buffer, 'photo.jpg');
      expect(ImageConvertService.Resize).not.toHaveBeenCalled();
      expect(imageRepository.create).toHaveBeenCalledWith({
        path: 'ab/cd/ef/abc123.jpg',
        type: 'image/jpeg',
        title: 'Test',
        width: 800,
        height: 600,
      });
      expect(result.id).toBe(1);
      expect(result.url).toBe('/images/1/raw');
    });

    it('should resize when target dimensions differ', async (): Promise<void> => {
      const resizeInput = { ...input, width: 400, height: 300 };

      await service.store(resizeInput as UploadImageInput);

      expect(ImageConvertService.Resize).toHaveBeenCalledWith(input.buffer, 400, 300);
      expect(fileService.put).toHaveBeenCalledWith(Buffer.from('resized'), 'photo.jpg');
    });

    it('should not resize when dimensions match', async (): Promise<void> => {
      const sameInput = { ...input, width: 800, height: 600 };

      await service.store(sameInput as UploadImageInput);

      expect(ImageConvertService.Resize).not.toHaveBeenCalled();
    });
  });

  describe('fetch', () => {
    it('should return buffer with metadata', async (): Promise<void> => {
      const result = await service.fetch(1);

      expect(result.buffer).toEqual(Buffer.from('fake'));
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.filename).toBe('abc123.jpg');
    });

    it('should throw NotFoundException when record not found', async (): Promise<void> => {
      imageRepository.findById.mockResolvedValue(null);

      await expect(service.fetch(99)).rejects.toThrow(NotFoundException);
    });

    it('should throw Error when file missing in storage', async (): Promise<void> => {
      fileService.get.mockResolvedValue(null);

      await expect(service.fetch(1)).rejects.toThrow('Unable to find');
    });
  });

  describe('findOne', (): void => {
    it('should return dto for existing image', async (): Promise<void> => {
      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.title).toBe('Test');
      expect(result.url).toBe('/images/1/raw');
    });

    it('should throw NotFoundException for missing image', async (): Promise<void> => {
      imageRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('find', (): void => {
    it('should return paginated results', async (): Promise<void> => {
      const result: PaginatedResponseDto<ImageResponseDto> = await service.find(1, 20);

      expect(imageRepository.findAll).toHaveBeenCalledWith({ title: undefined, limit: 20, offset: 0 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should pass title filter', async (): Promise<void> => {
      await service.find(1, 20, 'sunset');

      expect(imageRepository.findAll).toHaveBeenCalledWith({ title: 'sunset', limit: 20, offset: 0 });
    });

    it('should clamp limit to 100', async (): Promise<void> => {
      await service.find(1, 500);

      expect(imageRepository.findAll).toHaveBeenCalledWith({ title: undefined, limit: 100, offset: 0 });
    });

    it('should calculate offset from page', async (): Promise<void> => {
      await service.find(3, 10);

      expect(imageRepository.findAll).toHaveBeenCalledWith({ title: undefined, limit: 10, offset: 20 });
    });
  });
});