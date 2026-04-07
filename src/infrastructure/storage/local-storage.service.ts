import * as path from 'path';
import { promises as fs } from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../application/interfaces/storage.interface';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly uploadPath: string;

  public constructor(private readonly config: ConfigService) {
    this.uploadPath = config.get<string>('LOCAL_STORAGE_DIR', './uploads');
  }

  public async put(file: Buffer, filePath: string): Promise<string> {
    const uploadPath: string = path.resolve(this.uploadPath, filePath);
    const uploadDir: string = path.dirname(uploadPath);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(uploadPath, file);
    return filePath;
  }

  public async get(filePath: string): Promise<Buffer> {
    const downloadPath: string = path.resolve(this.uploadPath, filePath);
    const data = await fs.readFile(downloadPath) as Buffer;
    return Buffer.from(data);
  }

  public async delete(filePath: string): Promise<void> {
    const deletePath: string = path.resolve(this.uploadPath, filePath);
    await fs.unlink(deletePath);
  }
}