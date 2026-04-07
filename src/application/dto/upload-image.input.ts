import { UploadImageDto } from './upload-image.dto.js';

export class UploadImageInput {
  constructor(
    public readonly buffer: Buffer,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly title: string,
    public readonly width?: number,
    public readonly height?: number,
  ) {}

  static fromRequest(file: any, dto: UploadImageDto): UploadImageInput {
    return new UploadImageInput(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      dto.title,
      dto.width,
      dto.height,
    );
  }
}