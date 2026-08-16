import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Pool, type PoolClient } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function aplicarMigration(client: PoolClient, nome: string, sql: string) {
  const existente = await client.query('select 1 from schema_migration where nome = $1', [nome]);
  if (existente.rowCount) return;
  await client.query(sql);
  await client.query('insert into schema_migration (nome) values ($1)', [nome]);
}

export async function executarMigrations() {
  const client = await pool.connect();
  try {
    await client.query('create table if not exists schema_migration (nome text primary key, aplicado_em timestamptz not null default now())');
    const diretorio = path.join(process.cwd(), 'db', 'migrations');
    const arquivos = (await fs.readdir(diretorio)).filter((nome) => nome.endsWith('.sql')).sort();
    for (const nome of arquivos) {
      const sql = await fs.readFile(path.join(diretorio, nome), 'utf8');
      await client.query('begin');
      try {
        await aplicarMigration(client, nome, sql);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}
