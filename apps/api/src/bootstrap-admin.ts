import bcrypt from 'bcryptjs';
import { pool, executarMigrations } from './db.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const nome = process.env.BOOTSTRAP_ADMIN_NOME?.trim();
const senha = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!email || !nome || !senha || senha.length < 8) {
  throw new Error('Defina BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NOME e BOOTSTRAP_ADMIN_PASSWORD com senha de 8 caracteres');
}

await executarMigrations();
const senhaHash = await bcrypt.hash(senha, 12);
const client = await pool.connect();
try {
  await client.query('begin');
  const usuario = await client.query(`
    insert into usuario (email, nome, senha_hash)
    values ($1, $2, $3)
    on conflict (email) do update set nome = excluded.nome, senha_hash = excluded.senha_hash, ativo = true, atualizado_em = now()
    returning id
  `, [email, nome, senhaHash]);
  await client.query(`
    insert into usuario_perfil (usuario_id, perfil)
    values ($1, 'administrador')
    on conflict (usuario_id) do update set perfil = 'administrador', atualizado_em = now()
  `, [usuario.rows[0].id]);
  await client.query('commit');
  console.log(`Administrador configurado: ${email}`);
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  client.release();
  await pool.end();
}
