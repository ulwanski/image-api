import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImageService } from '../services/image.service';
import { ImageRecord } from '../repository/image.repository';
import { ImageResponseDto } from '../../../application/dto/image-response.dto';
import { PaginatedResponseDto } from '../../../application/dto/paginated-response.dto';

describe('ImagesController', (): void => {
  let controller: ImagesController;
  let imageService: jest.Mocked<ImageService>;

  const mockRecord: ImageRecord = {
    id: 1,
    path: 'ab/cd/ef/abcdef.jpg',
    type: 'image/jpeg',
    title: 'Test image',
    width: 800,
    height: 600,
    created_at: new Date('2025-01-01'),
  };

  const mockResponse: ImageResponseDto = {
    id: 1,
    title: 'Test image',
    url: '/images/1',
    width: 800,
    height: 600,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        {
          provide: ImageService,
          useValue: {
            store: jest.fn(),
            findOne: jest.fn(),
            fetch: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ImagesController);
    imageService = module.get(ImageService);
  });

  describe('upload', () => {
    it('should upload an image and return response dto', async (): Promise<void> => {
      imageService.store.mockResolvedValue(mockRecord);

      const file = {
        buffer: Buffer.from('fake'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const dto = { title: 'Test image', name: 'photo.jpg', size: 1024 };

      const result: ImageResponseDto = await controller.upload(file, dto as any);

      expect(imageService.store).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result.title).toBe('Test image');
    });
  });

  describe('findOne', (): void => {
    it('should return image metadata by id', async () => {
      imageService.findOne.mockResolvedValue(mockResponse);

      const result: ImageResponseDto = await controller.findOne(1);

      expect(imageService.findOne).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test image');
    });

    it('should propagate NotFoundException from service', async () => {
      imageService.findOne.mockRejectedValue(new NotFoundException('Image #99 not found'));

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOne (raw)', (): void => {
    it('should send buffer with correct headers', async () => {
      imageService.fetch.mockResolvedValue({
        buffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
        filename: 'abcdef.jpg',
      });

      const res = {
        set: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.getOne(1, res);

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpeg',
        'Content-Length': 10,
        'Content-Disposition': 'inline; filename="abcdef.jpg"',
      });
      expect(res.send).toHaveBeenCalledWith(Buffer.from('fake-image'));
    });

    it('should propagate NotFoundException when image not found', async (): Promise<void> => {
      imageService.fetch.mockRejectedValue(new NotFoundException('Image #99 not found'));

      const res = { set: jest.fn(), send: jest.fn() } as any;

      await expect(controller.getOne(99, res)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', (): void => {
    it('should return paginated results with defaults', async () => {
      const paginated = { data: [mockResponse], meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } };
      imageService.find.mockResolvedValue(paginated as any);

      const result: PaginatedResponseDto<ImageResponseDto> = await controller.findAll();

      expect(imageService.find).toHaveBeenCalledWith(1, 20, undefined);
      expect(result.data).toHaveLength(1);
    });

    it('should pass title and pagination params', async () => {
      imageService.find.mockResolvedValue({ data: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } } as any);

      await controller.findAll('sunset', 2, 10);

      expect(imageService.find).toHaveBeenCalledWith(2, 10, 'sunset');
    });
  });
});