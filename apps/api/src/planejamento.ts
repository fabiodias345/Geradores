import { pool } from './db.js';

export type PlanejamentoInput = { gerador_id: string; empresa_nome: string; empresa_email: string; mes_execucao: number; dia_execucao: number; troca_oleo_filtros: boolean; periodicidade_bateria_anos: number; ultima_bateria?: string | null; proxima_data: string };
function texto(v: unknown) { return typeof v === 'string' ? v.trim() : ''; }
function inteiro(v: unknown, padrao: number) { const n = Number(v); return Number.isInteger(n) ? n : padrao; }
export function validarPlanejamento(input: Partial<PlanejamentoInput>, parcial = false): PlanejamentoInput | Partial<PlanejamentoInput> {
  const r: Partial<PlanejamentoInput> = {};
  for (const campo of ['gerador_id', 'empresa_nome', 'empresa_email', 'proxima_data'] as const) {
    if (!parcial || input[campo] !== undefined) { r[campo] = texto(input[campo]); if (!r[campo]) throw new Error(`${campo} é obrigatório`); }
  }
  if (!parcial || input.mes_execucao !== undefined) r.mes_execucao = inteiro(input.mes_execucao, 0);
  if (!parcial || input.dia_execucao !== undefined) r.dia_execucao = inteiro(input.dia_execucao, 0);
  if (!parcial || input.periodicidade_bateria_anos !== undefined) r.periodicidade_bateria_anos = inteiro(input.periodicidade_bateria_anos, 0);
  if (r.mes_execucao !== undefined && (r.mes_execucao < 1 || r.mes_execucao > 12)) throw new Error('mês de execução inválido');
  if (r.dia_execucao !== undefined && (r.dia_execucao < 1 || r.dia_execucao > 28)) throw new Error('dia de execução inválido');
  if (r.periodicidade_bateria_anos !== undefined && (r.periodicidade_bateria_anos < 1 || r.periodicidade_bateria_anos > 10)) throw new Error('periodicidade da bateria inválida');
  if (!parcial || input.troca_oleo_filtros !== undefined) r.troca_oleo_filtros = input.troca_oleo_filtros !== false;
  if (input.ultima_bateria !== undefined) r.ultima_bateria = texto(input.ultima_bateria) || null;
  return r;
}
export async function listarPlanejamentos() { const result = await pool.query(`select p.*, g.identificacao as gerador_nome from planejamento_preventivo p join gerador g on g.id=p.gerador_id where p.ativo=true order by p.proxima_data, g.identificacao`); return result.rows; }
export async function criarPlanejamento(input: PlanejamentoInput, usuarioId: string) { const result = await pool.query(`insert into planejamento_preventivo (gerador_id,empresa_nome,empresa_email,mes_execucao,dia_execucao,troca_oleo_filtros,periodicidade_bateria_anos,ultima_bateria,proxima_data,criado_por) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`, [input.gerador_id,input.empresa_nome,input.empresa_email,input.mes_execucao,input.dia_execucao,input.troca_oleo_filtros,input.periodicidade_bateria_anos,input.ultima_bateria ?? null,input.proxima_data,usuarioId]); return result.rows[0]; }
export async function atualizarPlanejamento(id: string, input: Partial<PlanejamentoInput>) { const anterior = await pool.query('select * from planejamento_preventivo where id=$1 and ativo=true', [id]); if (!anterior.rowCount) throw new Error('planejamento não encontrado'); const a = { ...anterior.rows[0], ...input }; const result = await pool.query(`update planejamento_preventivo set gerador_id=$1,empresa_nome=$2,empresa_email=$3,mes_execucao=$4,dia_execucao=$5,troca_oleo_filtros=$6,periodicidade_bateria_anos=$7,ultima_bateria=$8,proxima_data=$9,atualizado_em=now(),lembrete_enviado_em=null where id=$10 returning *`, [a.gerador_id,a.empresa_nome,a.empresa_email,a.mes_execucao,a.dia_execucao,a.troca_oleo_filtros,a.periodicidade_bateria_anos,a.ultima_bateria ?? null,a.proxima_data,id]); return result.rows[0]; }
export async function apagarPlanejamento(id: string) { const result = await pool.query('update planejamento_preventivo set ativo=false,atualizado_em=now() where id=$1 and ativo=true returning id', [id]); if (!result.rowCount) throw new Error('planejamento não encontrado'); }
