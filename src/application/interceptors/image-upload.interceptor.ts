import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';

export class ImageUploadInterceptor extends FileInterceptor('file', {
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|tiff|avif)$/)) {
      return callback(new BadRequestException('Only image files are allowed'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 15 * 1024 * 1024,   // Limit size to 15MB
  },
}) {}