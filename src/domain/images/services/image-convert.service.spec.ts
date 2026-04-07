import sharp from 'sharp';
import { Mock } from 'node:test';
import { ImageConvertService } from './image-convert.service';
import { ImageMetadata } from '../../../application/interfaces/image-metadata.interface';

jest.mock('sharp');

describe('ImageConvertService', (): void => {
  const mockMetadata: Mock<any> = jest.fn();
  const mockResize: Mock<any> = jest.fn();
  const mockToBuffer: Mock<any> = jest.fn();

  beforeEach((): void => {
    (sharp as unknown as jest.Mock).mockReturnValue({
      metadata: mockMetadata,
      resize: mockResize,
    });
    mockResize.mockReturnValue({ toBuffer: mockToBuffer });
  });

  afterEach(() => jest.restoreAllMocks());

  describe('GetMetadata', (): void => {
    it('should return dimensions and mime type', async (): Promise<void> => {
      mockMetadata.mockResolvedValue({ width: 800, height: 600, format: 'jpeg' });

      const result: ImageMetadata = await ImageConvertService.GetMetadata(Buffer.from('fake'));

      expect(result).toEqual({
        width: 800,
        height: 600,
        format: 'jpeg',
        mimeType: 'image/jpeg',
      });
    });

    it('should map known formats to mime types', async (): Promise<void> => {
      for (const [format, mime] of [['png', 'image/png'], ['webp', 'image/webp'], ['gif', 'image/gif']]) {
        mockMetadata.mockResolvedValue({ width: 100, height: 100, format });
        const result = await ImageConvertService.GetMetadata(Buffer.from('x'));
        expect(result.mimeType).toBe(mime);
      }
    });

    it('should fallback to application/octet-stream for unknown format', async () => {
      mockMetadata.mockResolvedValue({ width: 100, height: 100, format: 'bmp' });

      const result: ImageMetadata = await ImageConvertService.GetMetadata(Buffer.from('x'));

      expect(result.mimeType).toBe('application/octet-stream');
    });

    it('should throw when dimensions missing', async (): Promise<void> => {
      mockMetadata.mockResolvedValue({ format: 'jpeg' });

      await expect(ImageConvertService.GetMetadata(Buffer.from('x')))
        .rejects.toThrow('Unable to detect image dimensions.');
    });

    it('should throw when format missing', async (): Promise<void> => {
      mockMetadata.mockResolvedValue({ width: 100, height: 100 });

      await expect(ImageConvertService.GetMetadata(Buffer.from('x')))
        .rejects.toThrow('Unable to detect image format.');
    });
  });

  describe('Resize', (): void => {
    it('should call sharp resize with correct options', async (): Promise<void> => {
      const resized: Buffer = Buffer.from('resized');
      mockToBuffer.mockResolvedValue(resized);

      const result: Buffer = await ImageConvertService.Resize(Buffer.from('fake'), 400, 300);

      expect(mockResize).toHaveBeenCalledWith(400, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(result).toBe(resized);
    });
  });
});