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

  public async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  public async createBucket(bucketName: string): Promise<void> {
    await this.client.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      }),
    );
  }

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

  public async get(filePath: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      }),
    );

    return this.streamToBuffer(res.Body as any);
  }

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