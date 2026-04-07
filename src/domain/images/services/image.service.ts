import path from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileService } from './file.service';
import { ImageRecord, ImageRepository } from '../repository/image.repository';
import { ImageConvertService } from './image-convert.service';
import { UploadImageInput } from '../../../application/dto/upload-image.input';
import { ImageResponseDto } from '../../../application/dto/image-response.dto';
import { ImageMetadata } from '../../../application/interfaces/image-metadata.interface';
import { PaginatedResponseDto } from '../../../application/dto/paginated-response.dto';

/**
 * Orchestrates image upload, retrieval, and listing operations.
 * Coordinates between file storage, image processing, and database persistence.
 */
@Injectable()
export class ImageService {
  constructor(private readonly fileService: FileService, private readonly imageRepository: ImageRepository) {}

  /**
   * Processes and stores an uploaded image.
   * Detects original dimensions, optionally resizes to target dimensions,
   * optimizes file size, persists to storage and saves metadata to database.
   *
   * @param image - Upload input containing file buffer and metadata
   * @returns Image response DTO with generated ID and URL
   */
  public async store(image: UploadImageInput): Promise<ImageResponseDto> {
    let buffer: Buffer = image.buffer;

    // Detect image dimensions and type
    const imageMetadata: ImageMetadata = await ImageConvertService.GetMetadata(buffer);
    const width: number = image.width || imageMetadata.width;
    const height: number = image.height || imageMetadata.height;

    // Detect if image require scaling (if requested size is set and it's different from actual size)
    if ((image.width && imageMetadata.width !== image.width) || (image.height && imageMetadata.height !== image.height)) {
      // Scale image to new size
      buffer = await ImageConvertService.Resize(buffer, width, height);
    }

    //Optimize image size
    buffer = await ImageConvertService.OptimizeSize(buffer, 80);

    // Save file data into storage
    const localUrl: string = await this.fileService.put(buffer, image.originalName);

    // Save file info into database
    const record: ImageRecord = await this.imageRepository.create({
      path: localUrl,
      type: imageMetadata.mimeType,
      title: image.title,
      width,
      height,
    });

    return this.mapToDto(record);
  }

  /**
   * Fetches the binary image file by ID.
   *
   * @param id - Image record ID
   * @returns Object containing the file buffer, MIME type, and filename
   * @throws NotFoundException when no image record exists for the given ID
   * @throws Error when the file is missing from storage
   */
  public async fetch(id: number): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    // Find image metadata in database
    const record: ImageRecord | null = await this.imageRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Image #${id} not found`);
    }

    // Fetch file from file storage
    const buffer: Buffer | null = await this.fileService.get(record.path);

    if (!buffer) {
      throw new Error(`Unable to find "${record.path}" file in storage!`);
    }

    return {
      buffer,
      mimeType: record.type,
      filename: path.basename(record.path)
    };
  }

  /**
   * Retrieves image metadata by ID.
   *
   * @param id - Image record ID
   * @returns Image response DTO
   * @throws NotFoundException when no image record exists for the given ID
   */
  public async findOne(id: number): Promise<ImageResponseDto> {
    // Find image metadata in database
    const record: ImageRecord | null = await this.imageRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Image #${id} not found`);
    }

    return this.mapToDto(record);
  }

  /**
   * Returns a paginated list of images with optional title filtering.
   *
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (clamped to max 100)
   * @param title - Optional case-insensitive partial title filter
   * @returns Paginated response with image DTOs and pagination metadata
   */
  public async find(page: number, limit: number, title?: string): Promise<PaginatedResponseDto<ImageResponseDto>> {
    // Limit max amount of rows returned to 100
    limit = Math.min(limit, 100);

    const { rows, total } = await this.imageRepository.findAll({
      title: title,
      limit: limit,
      offset: (page - 1) * limit,
    });

    const data: ImageResponseDto[] = rows.map((record: ImageRecord) => this.mapToDto(record));

    return PaginatedResponseDto.of(data, total, page, limit);
  }

  private mapToDto(record: ImageRecord): ImageResponseDto {
    return Object.assign(new ImageResponseDto(), {
      id: record.id,
      title: record.title,
      url: `/images/${record.id}/raw`,
      width: record.width,
      height: record.height,
      createdAt: record.created_at,
    });
  }
}