import path from 'node:path';

export async function runMigrations(baseDir: string): Promise<void> {
  const { runner } = await import('node-pg-migrate');

  await runner({
    databaseUrl: getDatabaseUrl(),
    migrationsTable: 'migrations',
    dir: path.resolve(baseDir, '../migrations'),
    direction: 'up',
  });
}

function getDatabaseUrl(): string {
  return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}