export interface StorageService {
  put(file: Buffer, filePath: string): Promise<string>;
  get(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
}