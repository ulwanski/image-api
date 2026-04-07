import * as path from 'path';
import { promises as fs } from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../application/interfaces/storage.interface';

/**
 * Local filesystem implementation of the StorageService interface.
 * Stores files on disk under a configurable base directory.
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly uploadPath: string;

  public constructor(private readonly config: ConfigService) {
    this.uploadPath = config.get<string>('LOCAL_STORAGE_DIR', './uploads');
  }

  /**
   * Writes a file to the local filesystem.
   * Creates parent directories recursively if they do not exist.
   *
   * @param file - File buffer to write
   * @param filePath - Relative path within the storage directory
   * @returns The storage path of the written file
   */
  public async put(file: Buffer, filePath: string): Promise<string> {
    const uploadPath: string = path.resolve(this.uploadPath, filePath);
    const uploadDir: string = path.dirname(uploadPath);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(uploadPath, file);
    return filePath;
  }

  /**
   * Reads a file from the local filesystem.
   *
   * @param filePath - Relative path within the storage directory
   * @returns File contents as a buffer
   */
  public async get(filePath: string): Promise<Buffer> {
    const downloadPath: string = path.resolve(this.uploadPath, filePath);
    const data = await fs.readFile(downloadPath) as Buffer;
    return Buffer.from(data);
  }

  /**
   * Deletes a file from the local filesystem.
   *
   * @param filePath - Relative path within the storage directory
   */
  public async delete(filePath: string): Promise<void> {
    const deletePath: string = path.resolve(this.uploadPath, filePath);
    await fs.unlink(deletePath);
  }
}