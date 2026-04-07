import { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import { StorageService } from '../../application/interfaces/storage.interface';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand, HeadBucketCommand,
} from '@aws-sdk/client-s3';

/**
 * S3-compatible implementation of the StorageService interface.
 * Works with Amazon S3, MinIO, and other S3-compatible providers.
 * Automatically creates the target bucket on module initialization if it does not exist.
 */
@Injectable()
export class S3StorageService implements StorageService {
  private client: S3Client;
  private readonly bucket: string

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET', 'default');
    this.client = new S3Client({
      region: config.get<string>('S3_REGION', 'eu-central-1-waw-1a'),
      endpoint: config.get<string>('S3_ENDPOINT', 'http://minio:9000'),
      credentials: {
        accessKeyId: config.get<string>('S3_KEY_ID', ''),
        secretAccessKey: config.get<string>('S3_ACCESS_KEY', ''),
      },
      forcePathStyle: true,
    });
  }

  /**
   * Ensures the configured S3 bucket exists, creating it if necessary.
   * Called automatically by NestJS on module initialization.
   */
  public async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  /**
   * Uploads a file to the S3 bucket.
   *
   * @param file - File buffer to upload
   * @param filePath - Object key (path) within the bucket
   * @returns The object key of the uploaded file
   */
  public async put(file: Buffer, filePath: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: file,
      }),
    );

    return filePath;
  }

  /**
   * Downloads a file from the S3 bucket.
   *
   * @param filePath - Object key (path) within the bucket
   * @returns File contents as a buffer
   */
  public async get(filePath: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      }),
    );

    return this.streamToBuffer(res.Body as any);
  }

  /**
   * Deletes a file from the S3 bucket.
   *
   * @param filePath - Object key (path) within the bucket
   */
  public async delete(filePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      }),
    );
  }

  private async streamToBuffer(stream: Readable | Uint8Array): Promise<Buffer> {
    if (stream instanceof Uint8Array) {
      return Buffer.from(stream);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }
}