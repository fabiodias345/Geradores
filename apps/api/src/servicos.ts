import { pool } from './db.js';

export type ServicoInput = { gerador_id: string; tecnico_id?: string | null; tipo: 'corretiva' | 'preventiva'; titulo: string; data_os: string; descricao?: string | null; observacoes?: string | null };

function texto(valor: unknown) { return typeof valor === 'string' ? valor.trim() : ''; }
export function validarServico(input: Partial<ServicoInput>, parcial = false): ServicoInput | Partial<ServicoInput> {
  const resultado: Partial<ServicoInput> = {};
  for (const campo of ['gerador_id', 'titulo', 'data_os'] as const) { if (!parcial || input[campo] !== undefined) { resultado[campo] = texto(input[campo]); if (!resultado[campo]) throw new Error(`${campo} é obrigatório`); } }
  if (!parcial || input.tipo !== undefined) { if (!['corretiva', 'preventiva'].includes(input.tipo ?? '')) throw new Error('tipo de serviço inválido'); resultado.tipo = input.tipo; }
  if (input.tecnico_id !== undefined) resultado.tecnico_id = texto(input.tecnico_id) || null;
  for (const campo of ['descricao', 'observacoes'] as const) if (input[campo] !== undefined) resultado[campo] = texto(input[campo]) || null;
  return resultado;
}

export async function listarServicos() {
  const result = await pool.query(`select os.*, g.identificacao as gerador_nome, t.nome as tecnico_nome from ordem_servico os join gerador g on g.id=os.gerador_id left join tecnico t on t.id=os.tecnico_id where os.ativo=true order by os.data_os desc, os.criado_em desc`);
  return result.rows;
}

export async function criarServico(input: ServicoInput, usuarioId: string) {
  const result = await pool.query(`insert into ordem_servico (gerador_id, tecnico_id, tipo, titulo, data_os, descricao, observacoes, criado_por) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`, [input.gerador_id, input.tecnico_id ?? null, input.tipo, input.titulo, input.data_os, input.descricao ?? null, input.observacoes ?? null, usuarioId]);
  return result.rows[0];
}

export async function atualizarServico(id: string, input: Partial<ServicoInput>) {
  const anterior = await pool.query('select * from ordem_servico where id=$1 and ativo=true', [id]);
  if (!anterior.rowCount) throw new Error('ordem de serviço não encontrada');
  const atual = { ...anterior.rows[0], ...input };
  const result = await pool.query(`update ordem_servico set gerador_id=$1, tecnico_id=$2, tipo=$3, titulo=$4, data_os=$5, descricao=$6, observacoes=$7, atualizado_em=now() where id=$8 returning *`, [atual.gerador_id, atual.tecnico_id ?? null, atual.tipo, atual.titulo, atual.data_os, atual.descricao ?? null, atual.observacoes ?? null, id]);
  return result.rows[0];
}

export async function apagarServico(id: string) { const result = await pool.query('update ordem_servico set ativo=false, atualizado_em=now() where id=$1 and ativo=true returning id', [id]); if (!result.rowCount) throw new Error('ordem de serviço não encontrada'); }
