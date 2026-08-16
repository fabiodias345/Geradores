import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { pool } from './db.js';

const cookieName = 'geradores_sessao';
const sessionDays = 7;

export function normalizarIdentificador(valor: string) {
  const identificador = valor.trim().toLowerCase();
  if (identificador.includes('@')) {
    if (!/^[^@\s]+@uel\.br$/.test(identificador)) throw new Error('use um e-mail institucional @uel.br');
    return { email: identificador, login: null };
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(identificador)) throw new Error('login inválido');
  return { email: null, login: identificador };
}

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
    select u.id, u.email, u.login, u.nome, p.perfil
    from sessao_usuario s
    join usuario u on u.id = s.usuario_id
    join usuario_perfil p on p.usuario_id = u.id
    where s.token_hash = $1 and s.expira_em > now() and u.ativo = true
  `, [hashToken(token)]);
  if (!result.rowCount) return null;
  await pool.query('update sessao_usuario set ultimo_acesso_em = now() where token_hash = $1', [hashToken(token)]);
  return result.rows[0] as { id: string; email: string | null; login: string | null; nome: string; perfil: string };
}

export async function encerrarSessao(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[cookieName];
  if (token) await pool.query('delete from sessao_usuario where token_hash = $1', [hashToken(token)]);
  reply.clearCookie(cookieName, { path: '/' });
}

export async function autenticar(identificador: string, senha: string) {
  const credencial = normalizarIdentificador(identificador);
  const result = await pool.query(`
    select id, senha_hash from usuario
    where ativo = true and (lower(email) = $1 or lower(login) = $1)
  `, [credencial.email ?? credencial.login]);
  const usuario = result.rows[0];
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) return null;
  return usuario.id as string;
}

export async function criarUsuario(identificador: string, nome: string, senha: string) {
  const credencial = normalizarIdentificador(identificador);
  const senhaHash = await bcrypt.hash(senha, 12);
  const result = await pool.query(
    'insert into usuario (email, login, nome, senha_hash) values ($1, $2, $3, $4) returning id',
    [credencial.email, credencial.login, nome.trim(), senhaHash],
  );
  await pool.query("insert into usuario_perfil (usuario_id, perfil) values ($1, 'tecnico')", [result.rows[0].id]);
  return result.rows[0].id as string;
}
