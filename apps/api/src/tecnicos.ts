import { pool } from './db.js';

export type TecnicoInput = {
  nome: string;
  documento?: string | null;
  telefone_whatsapp?: string | null;
  email?: string | null;
  especialidade?: string | null;
  acesso_app?: boolean;
  perfil?: 'tecnico' | 'tecnico_pro';
};

function texto(valor: unknown) { return typeof valor === 'string' ? valor.trim() || null : null; }

export function validarTecnico(input: Partial<TecnicoInput>, parcial = false): TecnicoInput | Partial<TecnicoInput> {
  if (!parcial && !texto(input.nome)) throw new Error('nome do técnico é obrigatório');
  const resultado: Partial<TecnicoInput> = {};
  if (!parcial || input.nome !== undefined) resultado.nome = texto(input.nome) as string;
  for (const campo of ['documento', 'telefone_whatsapp', 'email', 'especialidade'] as const) {
    if (input[campo] !== undefined) resultado[campo] = texto(input[campo]);
  }
  if (input.acesso_app !== undefined) resultado.acesso_app = Boolean(input.acesso_app);
  if (input.perfil !== undefined) {
    if (!['tecnico', 'tecnico_pro'].includes(input.perfil)) throw new Error('perfil de técnico inválido');
    resultado.perfil = input.perfil;
  }
  return resultado;
}

export async function listarTecnicos() {
  const result = await pool.query('select * from tecnico order by ativo desc, nome');
  return result.rows;
}

export async function criarTecnico(input: TecnicoInput, usuarioId: string) {
  const result = await pool.query(
    `insert into tecnico (nome, documento, telefone_whatsapp, email, especialidade, acesso_app, perfil, criado_por, atualizado_por)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$8) returning *`,
    [input.nome, input.documento ?? null, input.telefone_whatsapp ?? null, input.email ?? null, input.especialidade ?? null, input.acesso_app ?? false, input.perfil ?? 'tecnico', usuarioId],
  );
  return result.rows[0];
}

export async function atualizarTecnico(id: string, input: Partial<TecnicoInput>, usuarioId: string) {
  const anterior = await pool.query('select * from tecnico where id = $1 for update', [id]);
  if (!anterior.rowCount) throw new Error('técnico não encontrado');
  const atual = { ...anterior.rows[0], ...input };
  const result = await pool.query(
    `update tecnico set nome=$1, documento=$2, telefone_whatsapp=$3, email=$4, especialidade=$5, acesso_app=$6, perfil=$7, atualizado_por=$8, atualizado_em=now()
     where id=$9 returning *`,
    [atual.nome, atual.documento ?? null, atual.telefone_whatsapp ?? null, atual.email ?? null, atual.especialidade ?? null, atual.acesso_app, atual.perfil, usuarioId, id],
  );
  return result.rows[0];
}

export async function desativarTecnico(id: string, usuarioId: string) {
  const result = await pool.query('update tecnico set ativo=false, atualizado_por=$1, atualizado_em=now() where id=$2 returning id', [usuarioId, id]);
  if (!result.rowCount) throw new Error('técnico não encontrado');
}
