import bcrypt from 'bcryptjs';
import { pool } from './db.js';

export type AdministradorInput = { nome: string; email: string; senha?: string | null };

function texto(valor: unknown) { return typeof valor === 'string' ? valor.trim() : ''; }
function validarSenha(senha: string) { if (!/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(senha)) throw new Error('a senha deve ter no mínimo 8 caracteres, com letra, número e caractere especial'); }

export function validarAdministrador(input: Partial<AdministradorInput>, parcial = false): AdministradorInput | Partial<AdministradorInput> {
  const resultado: Partial<AdministradorInput> = {};
  if (!parcial || input.nome !== undefined) {
    resultado.nome = texto(input.nome);
    if (!resultado.nome) throw new Error('nome do administrador é obrigatório');
  }
  if (!parcial || input.email !== undefined) {
    resultado.email = texto(input.email).toLowerCase();
    if (!/^[^@\s]+@uel\.br$/.test(resultado.email)) throw new Error('use um e-mail institucional @uel.br');
  }
  if (input.senha !== undefined) {
    resultado.senha = texto(input.senha) || null;
    if (resultado.senha) validarSenha(resultado.senha);
  }
  return resultado;
}

export async function listarAdministradores() {
  const result = await pool.query(`select u.id, u.nome, u.email, u.ativo, u.criado_em from usuario u join usuario_perfil p on p.usuario_id = u.id where p.perfil = 'administrador' order by u.ativo desc, u.nome`);
  return result.rows;
}

export async function criarAdministrador(input: AdministradorInput) {
  if (!input.senha) throw new Error('senha é obrigatória para criar um administrador');
  const senhaHash = await bcrypt.hash(input.senha, 12);
  const client = await pool.connect();
  try {
    await client.query('begin');
    const usuario = await client.query('insert into usuario (email, nome, senha_hash) values ($1,$2,$3) returning id, nome, email, ativo, criado_em', [input.email, input.nome, senhaHash]);
    await client.query("insert into usuario_perfil (usuario_id, perfil) values ($1, 'administrador')", [usuario.rows[0].id]);
    await client.query('commit');
    return usuario.rows[0];
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}

export async function atualizarAdministrador(id: string, input: Partial<AdministradorInput>) {
  const anterior = await pool.query("select u.id, u.nome, u.email, u.ativo from usuario u join usuario_perfil p on p.usuario_id = u.id where u.id=$1 and p.perfil='administrador'", [id]);
  if (!anterior.rowCount) throw new Error('administrador não encontrado');
  const atual = { ...anterior.rows[0], ...input };
  await pool.query('update usuario set nome=$1, email=$2, atualizado_em=now() where id=$3', [atual.nome, atual.email, id]);
  if (input.senha) await pool.query('update usuario set senha_hash=$1 where id=$2', [await bcrypt.hash(input.senha, 12), id]);
  return (await pool.query('select id, nome, email, ativo, criado_em from usuario where id=$1', [id])).rows[0];
}

export async function desativarAdministrador(id: string) {
  const result = await pool.query("update usuario set ativo=false, atualizado_em=now() where id=$1 and exists (select 1 from usuario_perfil where usuario_id=$1 and perfil='administrador') returning id", [id]);
  if (!result.rowCount) throw new Error('administrador não encontrado');
}
