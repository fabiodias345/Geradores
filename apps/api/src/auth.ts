import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { pool } from './db.js';

const cookieName = 'geradores_sessao';
const sessionDays = 7;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function cookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionDays * 86400 };
}

export async function criarSessao(usuarioId: string, reply: FastifyReply) {
  const token = randomBytes(32).toString('hex');
  await pool.query("insert into sessao_usuario (usuario_id, token_hash, expira_em) values ($1, $2, now() + interval '7 days')", [usuarioId, hashToken(token)]);
  reply.setCookie(cookieName, token, cookieOptions());
}

export async function obterUsuario(request: FastifyRequest) {
  const token = request.cookies[cookieName];
  if (!token) return null;
  const result = await pool.query(`
    select u.id, u.email, u.nome, p.perfil
    from sessao_usuario s
    join usuario u on u.id = s.usuario_id
    join usuario_perfil p on p.usuario_id = u.id
    where s.token_hash = $1 and s.expira_em > now() and u.ativo = true
  `, [hashToken(token)]);
  if (!result.rowCount) return null;
  await pool.query('update sessao_usuario set ultimo_acesso_em = now() where token_hash = $1', [hashToken(token)]);
  return result.rows[0] as { id: string; email: string; nome: string; perfil: string };
}

export async function encerrarSessao(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[cookieName];
  if (token) await pool.query('delete from sessao_usuario where token_hash = $1', [hashToken(token)]);
  reply.clearCookie(cookieName, { path: '/' });
}

export async function autenticar(email: string, senha: string) {
  const result = await pool.query('select id, senha_hash from usuario where lower(email) = lower($1) and ativo = true', [email]);
  const usuario = result.rows[0];
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) return null;
  return usuario.id as string;
}

export async function criarUsuario(email: string, nome: string, senha: string) {
  const senhaHash = await bcrypt.hash(senha, 12);
  const result = await pool.query('insert into usuario (email, nome, senha_hash) values ($1, $2, $3) returning id', [email.toLowerCase(), nome, senhaHash]);
  await pool.query('insert into usuario_perfil (usuario_id, perfil) values ($1, \'tecnico\')', [result.rows[0].id]);
  return result.rows[0].id as string;
}
