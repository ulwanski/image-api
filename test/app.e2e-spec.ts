import request from 'supertest';
import { Pool } from 'pg';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DATABASE_POOL } from '../src/infrastructure/database/database.providers';

const testImage: string = resolve(__dirname, 'fixtures/test-photo.jpg');

describe('Images API (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let createdId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    pool = moduleFixture.get<Pool>(DATABASE_POOL);
  });

  afterAll(async () => {
    if (createdId) {
      await pool.query('DELETE FROM images WHERE id = $1', [createdId]);
    }
    await app.close();
  });

  describe('POST /images', () => {
    it('should upload an image and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/images')
        .attach('file', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('title', 'E2E Test Image')
        .field('width', '800')
        .field('height', '600')
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Image');
      expect(res.body.url).toContain('/images/');
      createdId = res.body.id;
    });

    it('should return 400 when file is missing', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .field('title', 'No file')
        .expect(400);
    });

    it('should return 400 when title is missing', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .attach('file', Buffer.from('fake'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);
    });
  });

  describe('GET /images/:id', () => {
    it('should return image metadata', async () => {
      const res = await request(app.getHttpServer())
        .get(`/images/${createdId}`)
        .expect(200);

      expect(res.body.id).toBe(createdId);
      expect(res.body.title).toBe('E2E Test Image');
      expect(res.body).toHaveProperty('width');
      expect(res.body).toHaveProperty('height');
      expect(res.body).toHaveProperty('url');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/images/999999')
        .expect(404);
    });
  });

  describe('GET /images/:id/raw', () => {
    it('should return binary image with correct headers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/images/${createdId}/raw`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/image\//);
      expect(res.headers['content-disposition']).toContain('filename=');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/images/999999/raw')
        .expect(404);
    });
  });

  describe('GET /images', () => {
    it('should return paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/images')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
    });

    it('should filter by title', async () => {
      const res = await request(app.getHttpServer())
        .get('/images?title=E2E Test')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toContain('E2E Test');
    });

    it('should return empty list for non-matching title', async () => {
      const res = await request(app.getHttpServer())
        .get('/images?title=nonexistent_xyz_abc')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });

    it('should respect pagination params', async () => {
      const res = await request(app.getHttpServer())
        .get('/images?page=1&limit=1')
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.meta.limit).toBe(1);
    });
  });
});