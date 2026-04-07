import path from 'node:path';
import { extname } from 'path';
import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { StorageService } from '../../../application/interfaces/storage.interface.js';

@Injectable()
export class FileService {
  constructor(@Inject('StorageService') private readonly storage: StorageService) {}

  public async put(data: Buffer, originalName: string): Promise<string> {
    // Create hash from file data, f.e. 2896ee5e2fd3c12621bcc4ff9b9fe879f22fc15a55aaefb056fa72daf03d8b8f
    const fileHash: string = this.calculateFileHash(data);

    // Create nested directory path from hash, f.e. 28/96/ee
    const fileDir: string = this.calculateFilePath(fileHash);

    // Create file name from hash and original file name,
    // f.e. 2896ee5e2fd3c12621bcc4ff9b9fe879f22fc15a55aaefb056fa72daf03d8b8f.jpg
    const fileName: string = `${fileHash}${extname(originalName)}`;

    // Join path with name to create a 'key' for storage,
    // f.e. 28/96/ee/2896ee5e2fd3c12621bcc4ff9b9fe879f22fc15a55aaefb056fa72daf03d8b8f.jpg
    const filePath: string = path.join(fileDir, fileName);

    return this.storage.put(data, filePath);
  }

  public async get(path: string): Promise<Buffer | null> {
    return this.storage.get(path);
  }

  public async delete(path: string): Promise<void> {
    return this.storage.delete(path);
  }

  private calculateFileHash(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private calculateFilePath(hash: string, depth: number = 3): string {
    const parts: string[] = [];
    for (let i: number = 0; i < depth; i++) {
      parts.push(hash.slice(i * 2, i * 2 + 2));
    }

    return path.join(...parts);
  }
}