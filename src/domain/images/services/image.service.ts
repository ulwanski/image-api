import path from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileService } from './file.service';
import { ImageRecord, ImageRepository } from '../repository/image.repository';
import { ImageConvertService } from './image-convert.service';
import { UploadImageInput } from '../../../application/dto/upload-image.input';
import { ImageResponseDto } from '../../../application/dto/image-response.dto';
import { ImageMetadata } from '../../../application/interfaces/image-metadata.interface';
import { PaginatedResponseDto } from '../../../application/dto/paginated-response.dto';

@Injectable()
export class ImageService {
  constructor(private readonly fileService: FileService, private readonly imageRepository: ImageRepository) {}

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

  public async findOne(id: number): Promise<ImageResponseDto> {
    // Find image metadata in database
    const record: ImageRecord | null = await this.imageRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Image #${id} not found`);
    }

    return this.mapToDto(record);
  }

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