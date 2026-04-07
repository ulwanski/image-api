import sharp, {Metadata} from "sharp";
import { Injectable } from '@nestjs/common';
import { ImageMetadata } from '../../../application/interfaces/image-metadata.interface';

const mimeTypes: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  tiff: 'image/tiff',
  avif: 'image/avif',
};

@Injectable()
export class ImageConvertService {

  public static async GetMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const metadata: Metadata = await sharp(buffer).metadata();

    if (typeof metadata.width !== 'number' || typeof metadata.height !== 'number') {
      throw new Error('Unable to detect image dimensions.');
    }

    if (typeof metadata.format !== 'string') {
      throw new Error('Unable to detect image format.');
    }

    const mimeType: string = mimeTypes[metadata.format] ?? 'application/octet-stream';

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      mimeType,
    }
  }

  public static async Resize(data: Buffer, width: number, height: number): Promise<Buffer> {
    return sharp(data)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      }).toBuffer();
  }

  public static async OptimizeSize(data: Buffer, quality: number = 85): Promise<Buffer> {
    const metadata: ImageMetadata = await ImageConvertService.GetMetadata(data);

    switch (metadata.format) {
      case 'jpg':  return sharp(data).jpeg({ quality }).toBuffer();
      case 'jpeg': return sharp(data).jpeg({ quality }).toBuffer();
      case 'png':  return sharp(data).png({ quality, compressionLevel: 9 }).toBuffer();
      case 'webp': return sharp(data).webp({ quality }).toBuffer();
      case 'avif': return sharp(data).avif({ quality }).toBuffer();
      case 'tiff': return sharp(data).tiff({ quality }).toBuffer();
      case 'gif':  return sharp(data).gif().toBuffer();
      default:     return data;
    }
  }

}