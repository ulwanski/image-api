import path from 'node:path';

export async function runMigrations(baseDir: string): Promise<void> {
  const { runner } = await import('node-pg-migrate');

  const options: any = {
    databaseUrl: getDatabaseUrl(),
    migrationsTable: 'migrations',
    dir: path.resolve(baseDir, '../migrations'),
    direction: 'up',
  };

  await runner(options);
}

function getDatabaseUrl(): string {
  const missing: string[] = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME'
  ].filter(k => !process.env[k]);

  if (missing.length) {
    throw new Error(`Missing database env vars: ${missing.join(', ')}`);
  }

  return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}