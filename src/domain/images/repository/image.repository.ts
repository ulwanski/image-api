import { Pool, QueryResult } from 'pg';
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_POOL } from '../../../infrastructure/database/database.providers';

export interface ImageRecord {
  id: number;
  path: string;
  type: string;
  title: string | null;
  width: number;
  height: number;
  created_at: Date;
}

export interface CreateImageInput {
  path: string;
  type: string;
  title?: string;
  width: number;
  height: number;
}

export interface FindAllOptions {
  title?: string;
  limit: number;
  offset: number;
}

@Injectable()
export class ImageRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(input: CreateImageInput): Promise<ImageRecord> {
    const query: string = `INSERT INTO images (path, type, title, width, height) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const { rows } = await this.pool.query<ImageRecord>(query, [input.path, input.type, input.title ?? null, input.width, input.height]);

    return rows[0];
  }

  async findById(id: number): Promise<ImageRecord | null> {
    const query: string = `SELECT * FROM images WHERE id = $1`;
    const { rows } = await this.pool.query<ImageRecord>(query, [id]);
    return rows[0] ?? null;
  }

  async findAll(options: FindAllOptions): Promise<{ rows: ImageRecord[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.title) {
      const escapedTitle: string = options.title.replace(/[%_]/g, '\\$&');
      params.push(`%${escapedTitle}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    const where: string = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(options.limit);
    const limitIdx: string = `$${params.length}`;
    params.push(options.offset);
    const offsetIdx: string = `$${params.length}`;

    const dataQuery: Promise<QueryResult<ImageRecord>> = this.pool.query<ImageRecord>(
      `SELECT * FROM images ${where} ORDER BY created_at DESC LIMIT ${limitIdx} OFFSET ${offsetIdx}`,
      params,
    );

    const countQuery: Promise<QueryResult> = this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM images ${where}`,
      params.slice(0, conditions.length),
    );

    const [dataResult, countResult] = await Promise.all([
      dataQuery,
      countQuery,
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM images WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}